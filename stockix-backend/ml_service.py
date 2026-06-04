"""
STOCKIX — LSTM Stock Price Prediction Microservice
Runs as a separate Python Flask server on port 5001
Node.js backend calls this to get 7-day price predictions
"""

from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
import warnings
warnings.filterwarnings("ignore")

app = Flask(__name__)

# ── How LSTM works (explained simply) ────────────────────────────────────────
# 1. Take the last 60 days of closing prices
# 2. Normalize them to 0-1 range (makes training faster)
# 3. Feed sequences of 60 days into the LSTM
# 4. LSTM learns the pattern: "after these 60 days, what comes next?"
# 5. Predict the next 7 days one at a time
# 6. Denormalize back to real prices

SEQUENCE_LENGTH = 60   # how many past days the model looks at
PREDICTION_DAYS = 7    # how many future days to predict
EPOCHS          = 50   # how many times to train on the data
BATCH_SIZE      = 32   # how many samples per training step

def build_lstm_model(sequence_length):
    """
    Build the LSTM neural network architecture
    
    Layer structure:
    - LSTM(128)  -> learns long-term patterns
    - Dropout    -> prevents overfitting
    - LSTM(64)   -> learns shorter patterns  
    - Dropout    -> prevents overfitting
    - Dense(32)  -> combines learned features
    - Dense(1)   -> outputs single price prediction
    """
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=(sequence_length, 1)),
        Dropout(0.2),
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        Dense(32, activation="relu"),
        Dense(1)
    ])
    model.compile(optimizer="adam", loss="mean_squared_error")
    return model

def prepare_data(prices, sequence_length):
    """
    Convert price list into sequences for LSTM training
    
    Example with sequence_length=3:
    prices = [100, 102, 101, 105, 103]
    X = [[100,102,101], [102,101,105]]  (input sequences)
    y = [105, 103]                       (what comes after each sequence)
    """
    X, y = [], []
    for i in range(sequence_length, len(prices)):
        X.append(prices[i - sequence_length:i, 0])
        y.append(prices[i, 0])
    return np.array(X), np.array(y)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "LSTM Price Prediction"})

@app.route("/predict", methods=["POST"])
def predict():
    """
    Main prediction endpoint
    
    Request body:
    {
        "symbol": "AAPL",
        "prices": [150.2, 151.1, 149.8, ...]  // at least 60 historical closing prices
    }
    
    Response:
    {
        "symbol": "AAPL",
        "predictions": [152.1, 153.4, 151.8, 154.2, 155.0, 153.7, 156.1],
        "currentPrice": 150.2,
        "trend": "bullish",
        "confidence": 0.87,
        "modelInfo": { ... }
    }
    """
    try:
        data   = request.get_json()
        symbol = data.get("symbol", "UNKNOWN")
        prices = data.get("prices", [])

        # ── Validate input ────────────────────────────────────────────────────
        if len(prices) < SEQUENCE_LENGTH + 10:
            return jsonify({
                "error": f"Need at least {SEQUENCE_LENGTH + 10} price points to train. Got {len(prices)}."
            }), 400

        # ── Step 1: Prepare data ──────────────────────────────────────────────
        price_array = np.array(prices).reshape(-1, 1)

        # Normalize prices to 0-1 range
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled = scaler.fit_transform(price_array)

        # Create training sequences
        X, y = prepare_data(scaled, SEQUENCE_LENGTH)

        # Reshape X for LSTM: (samples, timesteps, features)
        X = X.reshape(X.shape[0], X.shape[1], 1)

        # ── Step 2: Build and train the model ─────────────────────────────────
        model = build_lstm_model(SEQUENCE_LENGTH)

        early_stop = EarlyStopping(
            monitor="loss",
            patience=5,          # stop if no improvement for 5 epochs
            restore_best_weights=True
        )

        model.fit(
            X, y,
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            callbacks=[early_stop],
            verbose=0            # silent training
        )

        # ── Step 3: Predict next 7 days ───────────────────────────────────────
        # Start with the last 60 known prices
        last_sequence = scaled[-SEQUENCE_LENGTH:].tolist()
        predictions_scaled = []

        for _ in range(PREDICTION_DAYS):
            # Reshape for model input
            seq = np.array(last_sequence[-SEQUENCE_LENGTH:]).reshape(1, SEQUENCE_LENGTH, 1)

            # Predict next price
            next_price = model.predict(seq, verbose=0)[0][0]
            predictions_scaled.append(next_price)

            # Add prediction to sequence for next iteration
            last_sequence.append([next_price])

        # Denormalize back to real prices
        predictions_real = scaler.inverse_transform(
            np.array(predictions_scaled).reshape(-1, 1)
        ).flatten().tolist()

        # Round to 2 decimal places
        predictions_real = [round(p, 2) for p in predictions_real]

        # ── Step 4: Calculate metrics ─────────────────────────────────────────
        current_price    = round(float(prices[-1]), 2)
        predicted_day7   = predictions_real[-1]
        price_change_pct = round(((predicted_day7 - current_price) / current_price) * 100, 2)

        # Trend based on predicted direction
        if price_change_pct > 2:
            trend = "bullish"
        elif price_change_pct < -2:
            trend = "bearish"
        else:
            trend = "neutral"

        # Simple confidence score based on training loss
        history     = model.history.history
        final_loss  = history["loss"][-1]
        confidence  = round(max(0, min(1, 1 - (final_loss * 10))), 2)

        return jsonify({
            "symbol":      symbol,
            "predictions": predictions_real,
            "currentPrice": current_price,
            "predictedDay7": predicted_day7,
            "priceChangePct": price_change_pct,
            "trend":       trend,
            "confidence":  confidence,
            "daysTrainedOn": len(prices),
            "modelInfo": {
                "type":           "LSTM",
                "layers":         "LSTM(128) → Dropout → LSTM(64) → Dropout → Dense(32) → Dense(1)",
                "sequenceLength": SEQUENCE_LENGTH,
                "epochs":         len(history["loss"]),
                "finalLoss":      round(final_loss, 6),
                "optimizer":      "Adam",
                "lossFunction":   "Mean Squared Error"
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("STOCKIX LSTM Prediction Service starting on port 5001...")
    print("Endpoints:")
    print("  GET  http://localhost:5001/health")
    print("  POST http://localhost:5001/predict")
    app.run(host="0.0.0.0", port=5001, debug=False) 