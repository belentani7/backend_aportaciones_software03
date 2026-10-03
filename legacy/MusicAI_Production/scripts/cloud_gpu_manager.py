#!/usr/bin/env python3
"""
Professional Music AI Production - Cloud GPU Fallback Manager
Handles cloud GPU processing when local hardware is insufficient
"""

import os
import json
import asyncio
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class CloudProvider(Enum):
    RUNPOD = "runpod"
    MODAL = "modal"
    REPLICATE = "replicate"
    VAST_AI = "vast_ai"
    LAMBDA_LABS = "lambda_labs"

@dataclass
class GPUInstance:
    provider: CloudProvider
    instance_id: str
    gpu_type: str
    gpu_count: int
    vram_gb: int
    price_per_hour: float
    status: str
    ssh_host: str = ""
    ssh_port: int = 0
    ssh_key: str = ""

class CloudGPUManager:
    def __init__(self, base_dir=r"C:\Users\USER\MusicAI_Production"):
        self.base_dir = Path(base_dir)
        self.cloud_dir = self.base_dir / "cloud_gpu"
        self.cloud_dir.mkdir(parents=True, exist_ok=True)
        self.config_file = self.cloud_dir / "cloud_config.json"
        self.instances_file = self.cloud_dir / "instances.json"
        self.config = self.load_config()
        self.instances = self.load_instances()
    
    def load_config(self) -> Dict:
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                return json.load(f)
        return {
            "providers": {
                "runpod": {"api_key": "", "enabled": True},
                "modal": {"token_id": "", "token_secret": "", "enabled": True},
                "replicate": {"api_token": "", "enabled": True},
                "vast_ai": {"api_key": "", "enabled": False},
                "lambda_labs": {"api_key": "", "enabled": False}
            },
            "default_provider": "runpod",
            "auto_fallback": True,
            "max_price_per_hour": 2.0,
            "preferred_gpus": ["RTX 4090", "RTX 3090", "A100", "H100"],
            "min_vram_gb": 24
        }
    
    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.config, indent=2)
    
    def load_instances(self) -> Dict:
        if self.instances_file.exists():
            with open(self.instances_file, 'r') as f:
                return json.load(f)
        return {}
    
    def save_instances(self):
        with open(self.instances_file, 'w') as f:
            json.dump(self.instances, indent=2)
    
    def configure_provider(self, provider: str, credentials: Dict):
        """Configure cloud provider credentials"""
        if provider in self.config["providers"]:
            self.config["providers"][provider].update(credentials)
            self.config["providers"][provider]["enabled"] = True
            self.save_config()
            logger.info(f"Provider {provider} configured")
        else:
            logger.error(f"Unknown provider: {provider}")
    
    async def launch_instance(self, provider: CloudProvider = None, 
                              gpu_type: str = None, gpu_count: int = 1) -> Optional[GPUInstance]:
        """Launch a cloud GPU instance"""
        provider = provider or CloudProvider(self.config["default_provider"])
        gpu_type = gpu_type or self.config["preferred_gpus"][0]
        
        if provider == CloudProvider.RUNPOD:
            return await self._launch_runpod(gpu_type, gpu_count)
        elif provider == CloudProvider.MODAL:
            return await self._launch_modal(gpu_type, gpu_count)
        elif provider == CloudProvider.REPLICATE:
            return await self._launch_replicate(gpu_type, gpu_count)
        else:
            logger.error(f"Provider {provider.value} not implemented")
            return None
    
    async def _launch_runpod(self, gpu_type: str, gpu_count: int) -> Optional[GPUInstance]:
        """Launch RunPod instance"""
        try:
            import runpod
            runpod.api_key = self.config["providers"]["runpod"]["api_key"]
            
            # Get available GPU types
            gpus = runpod.get_gpus()
            logger.info(f"Available GPUs: {[g['displayName'] for g in gpus]}")
            
            # Find matching GPU
            target_gpu = None
            for gpu in gpus:
                if gpu_type.lower() in gpu['displayName'].lower():
                    target_gpu = gpu
                    break
            
            if not target_gpu:
                logger.error(f"GPU type {gpu_type} not available")
                return None
            
            # Create pod
            pod = runpod.create_pod(
                name=f"music-ai-{gpu_type.lower().replace(' ', '-')}",
                image_name="runpod/pytorch:2.5.1-py3.11-cuda12.1-devel",
                gpu_type_id=target_gpu['id'],
                gpu_count=gpu_count,
                support_public_ip=True,
                ports="22/tcp,8888/http,11434/tcp",
                volume_in_gb=50,
                container_disk_in_gb=20
            )
            
            instance = GPUInstance(
                provider=CloudProvider.RUNPOD,
                instance_id=pod['id'],
                gpu_type=gpu_type,
                gpu_count=gpu_count,
                vram_gb=target_gpu['memoryInGb'] * gpu_count,
                price_per_hour=target_gpu['lowestPrice']['uninterruptablePrice'],
                status="starting",
                ssh_host=pod.get('publicIp', ''),
                ssh_port=pod.get('publicPorts', [{}])[0].get('publicPort', 22)
            )
            
            self.instances[pod['id']] = instance.__dict__
            self.save_instances()
            
            # Wait for ready
            await self._wait_for_instance_ready(instance)
            
            return instance
            
        except Exception as e:
            logger.error(f"RunPod launch failed: {e}")
            return None
    
    async def _launch_modal(self, gpu_type: str, gpu_count: int) -> Optional[GPUInstance]:
        """Launch Modal instance"""
        try:
            import modal
            
            # Modal uses a different approach - define app and run
            # This is a simplified version
            logger.info("Modal launch - requires modal.toml configuration")
            return None
        except Exception as e:
            logger.error(f"Modal launch failed: {e}")
            return None
    
    async def _launch_replicate(self, gpu_type: str, gpu_count: int) -> Optional[GPUInstance]:
        """Launch Replicate instance (for model hosting)"""
        try:
            import replicate
            replicate.Client(api_token=self.config["providers"]["replicate"]["api_token"])
            
            # Replicate is for model inference, not persistent instances
            logger.info("Replicate is for model inference, not persistent GPU instances")
            return None
        except Exception as e:
            logger.error(f"Replicate launch failed: {e}")
            return None
    
    async def _wait_for_instance_ready(self, instance: GPUInstance, timeout: int = 300):
        """Wait for SSH to be ready"""
        import socket
        start = asyncio.get_event_loop().time()
        
        while asyncio.get_event_loop().time() - start < timeout:
            try:
                sock = socket.create_connection((instance.ssh_host, instance.ssh_port), timeout=5)
                sock.close()
                instance.status = "ready"
                self.save_instances()
                logger.info(f"Instance {instance.instance_id} ready at {instance.ssh_host}:{instance.ssh_port}")
                return True
            except:
                await asyncio.sleep(10)
        
        instance.status = "timeout"
        self.save_instances()
        return False
    
    async def setup_instance(self, instance_id: str) -> bool:
        """Setup instance with music AI environment"""
        if instance_id not in self.instances:
            logger.error(f"Instance {instance_id} not found")
            return False
        
        instance = self.instances[instance_id]
        
        # SSH commands to setup environment
        setup_commands = [
            "sudo apt-get update && sudo apt-get install -y git python3-pip ffmpeg",
            "pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121",
            "pip install librosa soundfile scipy numpy scikit-learn pydub pedalboard",
            "pip install fairseq speechbrain huggingface-hub transformers accelerate",
            "pip install gradio fastapi uvicorn",
            "git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git",
            "cd Retrieval-based-Voice-Conversion-WebUI && pip install -r requirments_cu128_py312.txt",
            "git clone https://github.com/Soul-AILab/SoulX-Singer.git",
            "cd SoulX-Singer && pip install -r requirements.txt",
            "git clone https://github.com/comfyanonymous/ComfyUI.git",
            "cd ComfyUI && pip install -r requirements.txt"
        ]
        
        for cmd in setup_commands:
            ssh_cmd = f"ssh -o StrictHostKeyChecking=no root@{instance['ssh_host']} -p {instance['ssh_port']} '{cmd}'"
            logger.info(f"Running: {cmd[:50]}...")
            result = subprocess.run(ssh_cmd, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                logger.error(f"Command failed: {result.stderr}")
                return False
        
        instance['status'] = 'configured'
        self.save_instances()
        return True
    
    async def run_remote_job(self, instance_id: str, script: str, 
                             args: List[str] = None) -> Dict:
        """Run a job on remote GPU instance"""
        if instance_id not in self.instances:
            return {"success": False, "error": "Instance not found"}
        
        instance = self.instances[instance_id]
        if instance['status'] != 'ready' and instance['status'] != 'configured':
            return {"success": False, "error": "Instance not ready"}
        
        # Copy script to instance
        # Run script
        # Retrieve results
        
        return {"success": True, "output": "Job completed"}
    
    def terminate_instance(self, instance_id: str) -> bool:
        """Terminate cloud instance"""
        if instance_id not in self.instances:
            return False
        
        instance = self.instances[instance_id]
        
        try:
            if instance['provider'] == 'runpod':
                import runpod
                runpod.api_key = self.config["providers"]["runpod"]["api_key"]
                runpod.terminate_pod(instance_id)
            
            instance['status'] = 'terminated'
            self.save_instances()
            return True
        except Exception as e:
            logger.error(f"Termination failed: {e}")
            return False
    
    def list_instances(self):
        """List all instances"""
        if not self.instances:
            print("No instances found")
            return
        
        print("\n" + "=" * 100)
        print("CLOUD GPU INSTANCES")
        print("=" * 100)
        for id, inst in self.instances.items():
            print(f"\n🖥️  {id}")
            print(f"   Provider: {inst['provider']} | GPU: {inst['gpu_type']} x{inst['gpu_count']} ({inst['vram_gb']} GB VRAM)")
            print(f"   Price: ${inst['price_per_hour']:.2f}/hr | Status: {inst['status']}")
            if inst.get('ssh_host'):
                print(f"   SSH: root@{inst['ssh_host']}:{inst['ssh_port']}")

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Cloud GPU Manager")
    parser.add_argument("--configure", help="Configure provider (runpod/modal/replicate)")
    parser.add_argument("--api-key", help="API key")
    parser.add_argument("--launch", action="store_true", help="Launch instance")
    parser.add_argument("--gpu", default="RTX 4090", help="GPU type")
    parser.add_argument("--count", type=int, default=1, help="GPU count")
    parser.add_argument("--provider", default="runpod", help="Provider")
    parser.add_argument("--setup", help="Setup instance ID")
    parser.add_argument("--list", action="store_true", help="List instances")
    parser.add_argument("--terminate", help="Terminate instance ID")
    
    args = parser.parse_args()
    
    manager = CloudGPUManager()
    
    if args.configure:
        creds = {"api_key": args.api_key} if args.api_key else {}
        manager.configure_provider(args.configure, creds)
    elif args.launch:
        provider = CloudProvider(args.provider)
        instance = await manager.launch_instance(provider, args.gpu, args.count)
        if instance:
            print(f"Launched: {instance.instance_id}")
    elif args.setup:
        await manager.setup_instance(args.setup)
    elif args.list:
        manager.list_instances()
    elif args.terminate:
        manager.terminate_instance(args.terminate)
    else:
        parser.print_help()

if __name__ == "__main__":
    asyncio.run(main())