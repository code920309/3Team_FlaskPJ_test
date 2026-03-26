import os
from dotenv import load_dotenv

# dotenv 로드
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path)

from supabase import create_client, Client

def setup_storage():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("!!! Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing !!!")
        return

    supabase: Client = create_client(url, key)
    
    bucket_name = "reports-images"
    try:
        # 버킷 리스트 확인
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if bucket_name not in bucket_names:
            print(f"--- Bucket '{bucket_name}' not found. Creating... ---")
            supabase.storage.create_bucket(bucket_name, options={"public": True})
            print(f"Successfully created public bucket '{bucket_name}'.")
        else:
            print(f"Bucket '{bucket_name}' already exists.")
            
    except Exception as e:
        print(f"!!! Storage setup error: {e} !!!")

if __name__ == "__main__":
    setup_storage()
