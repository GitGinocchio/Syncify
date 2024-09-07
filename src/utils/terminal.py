from .config import config
from colorama import Fore as F
from datetime import datetime
import inspect
import logging
import sys
import os
import re

def clear():
    """call the command for clearing the terminal depending on your system"""
    os.system('cls' if os.name == 'nt' else 'clear')

def erase():
    """Erase last terminal line (this should work on all systems)"""
    print('')
    sys.stdout.write('\033[F')
    sys.stdout.write('\033[K')

levels = {
    "DEBUG"      :   (logging.DEBUG,      F.GREEN          ),
    "INFO"       :   (logging.INFO,       F.WHITE          ),
    "WARNING"    :   (logging.WARNING,    F.LIGHTYELLOW_EX ),
    "ERROR"      :   (logging.ERROR,      F.YELLOW         ),
    "CRITICAL"   :   (logging.CRITICAL,   F.LIGHTRED_EX    ),
    "FATAL"      :   (logging.FATAL,      F.RED            )
}

class CustomColorsFormatter(logging.Formatter):
    def format(self, record : logging.LogRecord):
        color = levels.get(record.levelname, F.WHITE)
        record.name = f"{F.LIGHTMAGENTA_EX}[{record.name}]{F.RESET}"
        record.msg = f": {color[1]}{record.msg}{F.RESET}"
        record.levelname = f"{color[1]}[{record.levelname}]{F.RESET}"

        return super().format(record)

formatter = CustomColorsFormatter(
    '[%(asctime)s] %(name)s %(levelname)s %(message)s',
    datefmt=config["logger"]["datefmt"])

stream = logging.StreamHandler(sys.stdout)
stream.setFormatter(formatter)

if config["logger"]["tofile"]:
    logfile = logging.FileHandler("{}/{}".format(
        config["logger"]['dir'],
        datetime.now().strftime(config["logger"]["datefmt"])))
    logfile.setFormatter(formatter)

level = levels.get(config["logger"]["level"], logging.INFO)


def getlogger() -> logging.Logger:
    filename = inspect.stack()[1].filename
    filename = re.match(r".*[\\/](.+?)(\.[^.]*$|$)", filename).group(1)

    logger = logging.getLogger(filename)

    if isinstance(level, tuple):
        logger.setLevel(level[0])
    else:
        logger.setLevel(level)

    logger.addHandler(stream)

    if config["logger"]["tofile"]:
        logger.addHandler(logfile)
    
    return logger