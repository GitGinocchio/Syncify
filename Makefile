# App files to copy
APP_DIR = SyncifyApp
# App name
APP_NAME = syncify
# App Directory
CUSTOM_APPS_DIR = %appdata%\spicetify\CustomApps

# Obiettivo principale
install: 
	@echo "Copying app directory..."
	xcopy "$(APP_DIR)" "$(CUSTOM_APPS_DIR)\$(APP_NAME)" /E /I /Y || (echo "Failed to copy directory." && exit /b 1)
	@echo "Configuring Spicetify..."
	@spicetify config custom_apps $(APP_NAME)
	@spicetify apply
	@echo "App installed."

# Obiettivo per disinstallare
uninstall: 
	@spicetify config custom_apps $(APP_NAME)-
	@spicetify apply
	@echo "App uninstalled."

# Obiettivo per pulire (opzionale)
clean:
	rmdir /S /Q "$(CUSTOM_APPS_DIR)\$(APP_NAME)"
	@echo "Cleaned up application files."