---
paths:
  - "package.json"
  - "package-lock.json"
---

# npm Package Security

Before installing any npm package:

1. Check direct dependencies: `npm view <pkg> dependencies`
2. Look for `axios` or known malicious packages in the dependency tree
3. After install, verify: `npm ls axios` (should return empty)

This is a precaution against supply chain attacks (e.g., axios malware incident).
