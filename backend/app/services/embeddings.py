"""
AWS Bedrock Embedding Service
Uses Amazon Titan Text Embeddings for semantic search
"""
import boto3
import json
from typing import List
from app.config import settings

# Initialize Bedrock client
bedrock_runtime = None

def get_bedrock_client():
    global bedrock_runtime
    if bedrock_runtime is None:
        bedrock_runtime = boto3.client(
            'bedrock-runtime',
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
    return bedrock_runtime

def get_embedding(text: str) -> List[float]:
    """
    Get embedding for a single text using AWS Bedrock Titan
    """
    client = get_bedrock_client()
    
    # Truncate text if too long (Titan supports up to 8k tokens)
    text = text[:8000]
    
    body = json.dumps({
        "inputText": text
    })
    
    response = client.invoke_model(
        modelId=settings.embedding_model,
        contentType='application/json',
        accept='application/json',
        body=body
    )
    
    response_body = json.loads(response['body'].read())
    return response_body['embedding']

def get_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Get embeddings for multiple texts
    """
    return [get_embedding(text) for text in texts]

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors
    """
    dot_product = sum(x * y for x, y in zip(a, b))
    magnitude_a = sum(x * x for x in a) ** 0.5
    magnitude_b = sum(x * x for x in b) ** 0.5
    
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
    
    return dot_product / (magnitude_a * magnitude_b)