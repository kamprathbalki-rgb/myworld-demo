# PM2 Quick Guide - MyWorld

## First-Time Setup (One Time Only)

Start application:

```cmd
cd D:\MyWorld
pm2 start app.js --name myworld
```

Save PM2 process list:

```cmd
pm2 save
```

(Optional) Configure PM2 startup:

```cmd
pm2 startup
```

---

## Daily Start Check

Open Command Prompt:

```cmd
pm2 list
```

If you see:

```text
myworld    online
```

Nothing else is required.

---

## If myworld is Stopped

```cmd
pm2 restart myworld
```

Check logs:

```cmd
pm2 logs myworld --lines 30
```

---

## If PM2 Forgot myworld

```cmd
cd D:\MyWorld
pm2 start app.js --name myworld
pm2 save
```

---

## View Logs

Live logs:

```cmd
pm2 logs myworld
```

Last 50 lines:

```cmd
pm2 logs myworld --lines 50
```

---

## Stop Server

```cmd
pm2 stop myworld
```

Verify:

```cmd
pm2 list
```

Status should show:

```text
stopped
```

---

## Restart Server

```cmd
pm2 restart myworld
```

---

## Shutdown Laptop

If PM2 has been saved:

```cmd
pm2 save
```

You can safely:

- Close CMD
- Restart Windows
- Shutdown Windows

After reboot:

```cmd
pm2 list
```

If myworld is online, you are done.

---

## Emergency Recovery

```cmd
cd D:\MyWorld
pm2 start app.js --name myworld
pm2 save
pm2 logs myworld --lines 30
```
