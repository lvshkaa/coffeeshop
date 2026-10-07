FROM node:24-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY --chown=node:node . .
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh
ENV NODE_ENV=production
ENV DATA_DIR=/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:${PORT:-3000}/healthz || exit 1
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
