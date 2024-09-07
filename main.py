from Syncify import server

from Syncify.utils.terminal import getlogger

logger = getlogger()

if __name__ == '__main__':
    logger.info(f"Server started at: http://localhost:{server.address[1]}")
    server.serve_forever()