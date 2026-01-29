"""
NukOpt - Email for AI Agents
Simple Python SDK for receiving emails with auto-extracted OTPs.

Usage:
    from nukopt import NukOpt
    
    # Register with your API key (one-time)
    nuk = NukOpt.register("openai", "sk-...")
    
    # Or use existing NukOpt key
    nuk = NukOpt("nk-...")
    
    # Create a mailbox
    email = nuk.create_mailbox()
    print(f"Use this email: {email}")
    
    # Wait for OTP
    otp = nuk.wait_for_otp(timeout=60)
    print(f"Got OTP: {otp}")
"""

import requests
import time
from typing import Optional, List, Dict, Any

BASE_URL = "https://nukopt.com/api/v1"


class NukOpt:
    def __init__(self, api_key: str):
        """Initialize with an existing NukOpt API key."""
        self.api_key = api_key
        self._mailbox_id: Optional[str] = None
        self._email: Optional[str] = None
    
    @classmethod
    def register(cls, provider: str, key: str) -> "NukOpt":
        """
        Register a new account using an API Key Passport.
        
        Args:
            provider: One of: openai, anthropic, openrouter, github, discord, etc.
            key: Your API key for that provider
            
        Returns:
            NukOpt instance ready to use
        """
        resp = requests.post(
            f"{BASE_URL}/register",
            json={"provider": provider, "key": key}
        )
        resp.raise_for_status()
        return cls(resp.json()["api_key"])
    
    def _headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"}
    
    def create_mailbox(self) -> str:
        """
        Create a new mailbox.
        
        Returns:
            Email address (e.g., "x7f2k9@nukopt.com")
        """
        resp = requests.post(f"{BASE_URL}/mailbox", headers=self._headers())
        resp.raise_for_status()
        data = resp.json()
        self._mailbox_id = data["id"]
        self._email = data["email"]
        return self._email
    
    def list_mailboxes(self) -> List[Dict[str, Any]]:
        """List all mailboxes for this account."""
        resp = requests.get(f"{BASE_URL}/mailbox", headers=self._headers())
        resp.raise_for_status()
        return resp.json()["mailboxes"]
    
    def get_messages(self, mailbox_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get messages for a mailbox.
        
        Args:
            mailbox_id: Mailbox ID (uses last created if not specified)
        """
        mid = mailbox_id or self._mailbox_id
        if not mid:
            raise ValueError("No mailbox ID - call create_mailbox() first")
        
        resp = requests.get(f"{BASE_URL}/mailbox/{mid}/messages", headers=self._headers())
        resp.raise_for_status()
        return resp.json()["messages"]
    
    def wait_for_otp(
        self, 
        mailbox_id: Optional[str] = None,
        timeout: int = 60,
        poll_interval: int = 3
    ) -> Optional[str]:
        """
        Wait for an email with an OTP.
        
        Args:
            mailbox_id: Mailbox ID (uses last created if not specified)
            timeout: Max seconds to wait
            poll_interval: Seconds between checks
            
        Returns:
            OTP string if found, None if timeout
        """
        mid = mailbox_id or self._mailbox_id
        if not mid:
            raise ValueError("No mailbox ID - call create_mailbox() first")
        
        start = time.time()
        seen_ids = set()
        
        while time.time() - start < timeout:
            messages = self.get_messages(mid)
            
            for msg in messages:
                if msg["id"] not in seen_ids:
                    seen_ids.add(msg["id"])
                    if msg.get("otp"):
                        return msg["otp"]
            
            time.sleep(poll_interval)
        
        return None
    
    def wait_for_link(
        self,
        mailbox_id: Optional[str] = None,
        timeout: int = 60,
        poll_interval: int = 3
    ) -> Optional[str]:
        """
        Wait for an email with a verification link.
        
        Returns:
            First verification link if found, None if timeout
        """
        mid = mailbox_id or self._mailbox_id
        if not mid:
            raise ValueError("No mailbox ID - call create_mailbox() first")
        
        start = time.time()
        seen_ids = set()
        
        while time.time() - start < timeout:
            messages = self.get_messages(mid)
            
            for msg in messages:
                if msg["id"] not in seen_ids:
                    seen_ids.add(msg["id"])
                    links = msg.get("verification_links", [])
                    if links:
                        return links[0]
            
            time.sleep(poll_interval)
        
        return None
    
    @property
    def email(self) -> Optional[str]:
        """Get the last created email address."""
        return self._email


# Quick one-liner functions
def get_temp_email(provider: str, key: str) -> tuple:
    """
    One-liner to get a temporary email.
    
    Returns:
        (nuk, email) tuple
        
    Example:
        nuk, email = nukopt.get_temp_email("openai", "sk-...")
        # Use email for signup
        otp = nuk.wait_for_otp()
    """
    nuk = NukOpt.register(provider, key)
    email = nuk.create_mailbox()
    return nuk, email
