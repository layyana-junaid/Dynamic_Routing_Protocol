import asyncio
import httpx
import os
from dotenv import load_dotenv

async def check():
    load_dotenv()
    host = os.getenv("GNS3_HOST", "127.0.0.1")
    port = os.getenv("GNS3_PORT", "3080")
    user = os.getenv("GNS3_USER")
    pw = os.getenv("GNS3_PASSWORD")
    
    url = f"http://{host}:{port}/v2/version"
    auth = (user, pw) if user and pw else None
    
    print(f"Checking GNS3 at {url} with user '{user}'...")
    async with httpx.AsyncClient(auth=auth) as client:
        try:
            resp = await client.get(url)
            print(f"GNS3 Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"GNS3 Data: {resp.json()}")
            else:
                print(f"GNS3 Error Body: {resp.text}")
        except Exception as e:
            print(f"GNS3 Connection Error: {e}")

    # Also check our own backend list
    print("\nChecking Backend Topology List...")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get("http://127.0.0.1:8000/api/topology/list")
            print(f"Backend Status: {resp.status_code}")
            print(f"Topologies: {resp.json()}")
        except Exception as e:
            print(f"Backend Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
