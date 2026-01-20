#!/bin/bash
# Download Google Fonts for local use
# Run this script when network is available

FONTS_DIR="../public/fonts"
mkdir -p "$FONTS_DIR"

echo "Downloading Open Sans fonts..."
# Open Sans
curl -L "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsiH0C4nY1M2xLER.woff2" -o "$FONTS_DIR/OpenSans-Light.woff2"
curl -L "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.woff2" -o "$FONTS_DIR/OpenSans-Regular.woff2"
curl -L "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjr0C4nY1M2xLER.woff2" -o "$FONTS_DIR/OpenSans-Medium.woff2"
curl -L "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsgH1y4nY1M2xLER.woff2" -o "$FONTS_DIR/OpenSans-SemiBold.woff2"
curl -L "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4nY1M2xLER.woff2" -o "$FONTS_DIR/OpenSans-Bold.woff2"

echo "Downloading Cormorant Garamond fonts..."
# Cormorant Garamond
curl -L "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.woff2" -o "$FONTS_DIR/CormorantGaramond-Regular.woff2"
curl -L "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEtHvky0eQ.woff2" -o "$FONTS_DIR/CormorantGaramond-Medium.woff2"
curl -L "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEtTvUy0eQ.woff2" -o "$FONTS_DIR/CormorantGaramond-SemiBold.woff2"
curl -L "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEtzvEy0eQ.woff2" -o "$FONTS_DIR/CormorantGaramond-Bold.woff2"

echo "Fonts downloaded to $FONTS_DIR"
ls -la "$FONTS_DIR"
