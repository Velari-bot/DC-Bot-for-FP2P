# Fix Upload Location

## The Problem
Files were uploaded to `/` (root) instead of `/home/container/dist/` because the directory doesn't exist.

## Solution: Create Directory and Move Files

Connect to SFTP and run these commands:

```powershell
sftp -P 2022 wrench.00442de6@5.189.154.69
```

Then run these SFTP commands:

```
mkdir -p /home/container/dist
cd /home/container/dist
put -r /achievements achievements
put -r /pfps pfps
put -r /thumbnails thumbnails
put -r /assets assets
put -r /content content
put -r /included included
put -r /videos videos
put /index.html index.html
put /main.*.js .
put /303.*.js .
put /945.*.js .
put /978.*.js .
put /reactPlayer*.js .
put /*.woff .
put /*.woff2 .
quit
```

**OR** simpler approach - just move everything:

```
mkdir -p /home/container/dist
!mv /achievements /home/container/dist/achievements
!mv /pfps /home/container/dist/pfps
!mv /thumbnails /home/container/dist/thumbnails
!mv /assets /home/container/dist/assets
!mv /content /home/container/dist/content
!mv /included /home/container/dist/included
!mv /videos /home/container/dist/videos
!mv /index.html /home/container/dist/index.html
!mv /*.js /home/container/dist/
!mv /*.woff /home/container/dist/
!mv /*.woff2 /home/container/dist/
quit
```

Note: The `!` prefix runs shell commands on the server, which might not work. Better to use the first method.

