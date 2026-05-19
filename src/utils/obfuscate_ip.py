def obfuscate_ip(ip: str | None) -> str:
    if not ip:
        return "unknown"
    parts = ip.split(".")
    if len(parts) == 4:
        parts[-1] = "xx"
        return ".".join(parts)
    return "xx:xx:xx:xx"