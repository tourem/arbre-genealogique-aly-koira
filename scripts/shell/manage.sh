#!/bin/bash
case "$1" in
  start)
    cd react-app && npm run dev &
    echo $! > .vite-dev.pid
    echo "Vite dev server started (PID: $(cat .vite-dev.pid))"
    ;;
  stop)
    if [ -f react-app/.vite-dev.pid ]; then
      kill "$(cat react-app/.vite-dev.pid)" 2>/dev/null
      rm react-app/.vite-dev.pid
      echo "Vite dev server stopped"
    else
      echo "No PID file found"
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop}"
    ;;
esac
