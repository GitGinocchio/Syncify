from SyncifyWeb import app, config, socketio, WebSocketHandler, WSGIServer
from SyncifyWeb.utils.terminal import getlogger

logger = getlogger()



if __name__ == '__main__':
    logger.info(f"Server started at: http://{config['address']}:{config['port']}")
    
    if config['debug-mode']:
        socketio.run(app, host=config['address'],port=config['port'], debug=True, use_reloader=True)
    else:
        server = WSGIServer(
            (config['address'], config['port']), 
            app, 
            handler_class=WebSocketHandler, 
            log=logger, 
            keyfile='SyncifyWeb/certs/cloudflare.key', 
            certfile='SyncifyWeb/certs/cloudflare.certfile'
        )
        server.serve_forever()