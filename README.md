brew install pyenv
pyenv install 3.7.3
pyenv global 3.7.3
echo -e 'if command -v pyenv 1>/dev/null 2>&1; then\n  eval "$(pyenv init -)"\nfi' >> ~/.bash_profile
