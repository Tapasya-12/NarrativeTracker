import numpy as np
import pandas as pd
from nomic import atlas

emb  = np.load("../data/embeddings.npy")
meta = pd.read_parquet("../data/search_meta.parquet")

# Convert datetime to string so Nomic accepts it
meta["created_utc"] = meta["created_utc"].astype(str)

# Prepare data records
data_records = meta[["title", "subreddit", "ideological_bloc"]].copy()
data_records["id"] = [str(i) for i in range(len(data_records))]

print(f"Uploading {len(emb)} embeddings to Nomic Atlas...")

dataset = atlas.map_data(
    embeddings=emb,
    data=data_records.to_dict(orient="records"),
    identifier="NarrativeTracker-Reddit-Political",
    description="Political Reddit posts Jul 2024 - Feb 2025",
    id_field="id",
)

print("Upload complete!")
print("Your map URL:")
print(dataset.maps[0].map_link)
print("\nYour embed ID:")
print(dataset.maps[0].embed_id)