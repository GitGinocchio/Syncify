CUSTOM_APPS_DIR = %appdata%\spicetify\CustomApps
EXTENSIONS_DIR = %appdata%\spicetify\Extensions

# Syncify Extension
EXT_DIR = SyncifyExt
EXT_NAME = syncify.js

# Syncify Custom App
APP_DIR = SyncifyApp
APP_NAME = syncify

# Apply Changes

apply:
	@spicetify apply

# Installing Ext/App

install:
	make install-app
	make install-ext

install-ext:
	make clean-ext
	copy "$(EXT_DIR)\$(EXT_NAME)" "$(EXTENSIONS_DIR)"
	@spicetify config extensions $(EXT_NAME)

install-app:
	make clean-app
	xcopy "$(APP_DIR)" "$(CUSTOM_APPS_DIR)\$(APP_NAME)" /E /I /Y || (echo "Failed to copy directory." && exit /b 1)
	@spicetify config custom_apps $(APP_NAME)

# Disabling Syncify Ext/App

uninstall-ext:
	@spicetify config extensions $(EXT_NAME)-

uninstall-app: 
	@spicetify config custom_apps $(APP_NAME)-

# Cleaning

clean-ext:
	del "$(EXTENSIONS_DIR)\$(EXT_NAME)"

clean-app:
	rmdir /S /Q "$(CUSTOM_APPS_DIR)\$(APP_NAME)" || (exit /b 0)

clean:
	make clean-ext
	make clean-app