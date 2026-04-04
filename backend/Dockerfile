FROM python:3.10-slim

# HuggingFace Spaces requires a non-root user
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy and install dependencies first (layer caching)
COPY --chown=user requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Download the sentence transformer model at build time
# so first request isn't slow
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy all backend files
COPY --chown=user . .

# HuggingFace Spaces MUST expose port 7860
EXPOSE 7860

# Use gunicorn for production — 1 worker because model is large
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "--timeout", "120", "app:app"]