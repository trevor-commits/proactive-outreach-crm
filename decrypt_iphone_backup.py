#!/usr/bin/env python3
"""
iPhone Backup Decryption Tool
Decrypts encrypted iPhone backups and extracts SMS and call history databases.

Requirements:
    pip3 install iphone-backup-decrypt

Usage:
    python3 decrypt_iphone_backup.py
"""

import sys
import getpass
import plistlib
from pathlib import Path
from datetime import datetime

try:
    from iphone_backup_decrypt import EncryptedBackup
except ImportError:
    print("❌ Required library not found!")
    print("\n📦 Please install it by running:")
    print("   pip3 install iphone-backup-decrypt")
    sys.exit(1)

# Internal iOS paths we want to extract
FILES_TO_EXTRACT = {
    "sms.db": "Library/SMS/sms.db",
    "CallHistory.storedata": "Library/CallHistoryDB/CallHistory.storedata",
}


def find_backup_directory() -> Path:
    """Find the iPhone backup directory on macOS."""
    backup_dir = Path.home() / "Library" / "Application Support" / "MobileSync" / "Backup"
    if not backup_dir.exists():
        print(f"❌ Backup directory not found: {backup_dir}")
        sys.exit(1)
    return backup_dir


def get_backup_info(backup_path: Path) -> dict:
    """Get backup metadata using plistlib."""
    manifest_plist = backup_path / "Manifest.plist"
    info_plist = backup_path / "Info.plist"

    is_encrypted = False
    device_name = "Unknown Device"

    if manifest_plist.exists():
        try:
            with open(manifest_plist, "rb") as f:
                data = plistlib.load(f)
                is_encrypted = bool(data.get("IsEncrypted", False))
        except Exception:
            pass

    if info_plist.exists():
        try:
            with open(info_plist, "rb") as f:
                data = plistlib.load(f)
                device_name = data.get("Device Name", "Unknown Device")
        except Exception:
            pass

    return {
        "path": backup_path,
        "name": backup_path.name,
        "device_name": device_name,
        "encrypted": is_encrypted,
        "modified": backup_path.stat().st_mtime,
    }


def perform_extraction(backup_obj: EncryptedBackup, output_dir: Path) -> int:
    """Extract SMS and Call History databases using EncryptedBackup."""
    extracted_count = 0

    for friendly_name, relative_path in FILES_TO_EXTRACT.items():
        print(f"\n📄 Extracting {friendly_name}...")
        try:
            backup_obj.extract_file(
                relative_path=relative_path,
                output_filename=str(output_dir / friendly_name),
            )
            print(f"   ✅ Saved to: {output_dir / friendly_name}")
            extracted_count += 1
        except Exception as e:
            print(f"   ⚠️  Skipped (not found or error): {e}")

    return extracted_count


def main() -> None:
    print("=" * 60)
    print("iPhone Backup Decryption Tool")
    print("=" * 60)

    backup_dir = find_backup_directory()
    backups = [d for d in backup_dir.iterdir() if d.is_dir()]

    if not backups:
        print("❌ No backups found.")
        sys.exit(1)

    # Collect info and sort newest first
    backup_infos = [get_backup_info(b) for b in backups]
    backup_infos.sort(key=lambda x: x["modified"], reverse=True)

    print(f"\n📱 Found {len(backup_infos)} backup(s):")
    for i, info in enumerate(backup_infos, 1):
        date_str = datetime.fromtimestamp(info["modified"]).strftime("%Y-%m-%d %I:%M %p")
        status = "🔒 Encrypted" if info["encrypted"] else "🔓 Unencrypted"
        print(f"   {i}. [{date_str}] {info['device_name']} ({status})")

    # Select backup
    while True:
        selection = input(f"\nSelect backup (1-{len(backup_infos)}) [Default: 1]: ").strip()
        if not selection:
            selected = backup_infos[0]
            break
        try:
            idx = int(selection) - 1
            if 0 <= idx < len(backup_infos):
                selected = backup_infos[idx]
                break
        except ValueError:
            pass
        print("Invalid selection.")

    # Prepare output folder
    output_dir = Path.home() / "Desktop" / "iPhone_Backup_Decrypted"
    output_dir.mkdir(exist_ok=True)
    print(f"\n📂 Output folder: {output_dir}")

    # Only handle encrypted backups
    if not selected["encrypted"]:
        print("\n⚠️  This backup is NOT encrypted.")
        print("This tool is designed for encrypted backups using iphone-backup-decrypt.")
        print("Enable encrypted backups in Finder/iTunes, make a new backup, and run this again.")
        return

    print("\n🔐 Backup is encrypted.")
    max_attempts = 3
    count = 0  # ensure defined even if we never succeed

    for attempt in range(max_attempts):
        pwd = getpass.getpass("Enter backup password: ")
        if not pwd:
            print("Password cannot be empty.")
            continue

        try:
            backup = EncryptedBackup(
                backup_directory=str(selected["path"]),
                passphrase=pwd,
            )
            print("✅ Password accepted. Extracting files...")
            count = perform_extraction(backup, output_dir)
            break
        except Exception as e:
            msg = str(e).lower()
            if "password" in msg or "mac verification failed" in msg:
                print("❌ Incorrect password.")
            else:
                print(f"❌ Error during decryption: {e}")
                break

        if attempt < max_attempts - 1:
            print(f"🔄 Try again ({max_attempts - attempt - 1} attempts remaining)")
        else:
            print("\n❌ Maximum attempts reached. Exiting.")
            sys.exit(1)

    if count > 0:
        print(f"\n✨ Done! {count} file(s) ready for CRM upload.")
    else:
        print("\n⚠️  No files were extracted (databases may be missing in this backup).")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(0)

