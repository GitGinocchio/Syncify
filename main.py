from src import server

from src.utils.terminal import getlogger

logger = getlogger()

if __name__ == '__main__':
    logger.info("Server started")
    server.serve_forever()