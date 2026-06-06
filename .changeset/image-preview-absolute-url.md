---
'@graphiql/react': patch
---

Fix image previews in the response viewer fetching from the wrong host. Monaco splits the hovered word on `:`, so a full URL like `https://example.com/img.png` reaches the preview as the protocol-relative `//example.com/img.png`. The preview stripped the leading character, turning that into the host-relative `/example.com/img.png` and fetching it from the current origin. The original host is now preserved.
