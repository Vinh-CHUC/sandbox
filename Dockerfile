FROM ubuntu:lunar
RUN apt-get update && apt-get install -y --no-install-recommends
RUN apt-get install -y git gh build-essential curl tmux zsh && apt-get clean

# Install neovim
RUN curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim.appimage
RUN chmod u+x nvim.appimage
RUN ./nvim.appimage --appimage-extract
RUN chmod a+x ./squashfs-root/usr/bin/nvim
RUN ln -s $(pwd)/squashfs-root/usr/bin/nvim /usr/local/bin/nvim

RUN useradd -ms /bin/zsh vinh
USER vinh

# Setup config-files from git repo
WORKDIR /home/vinh
RUN git clone --recursive https://github.com/Vinh-CHUC/config-files.git
WORKDIR /home/vinh/config-files
RUN make setup-zsh && make setup-tmux && make setup-nvim
RUN nvim --headless -c 'autocmd User PackerComplete quitall' -c 'PackerSync'
RUN nvim --headless -c 'autocmd User PackerComplete quitall' -c 'PackerSync'
RUN nvim --headless +"TSInstallSync org" +qa
RUN nvim --headless +"TSInstallSync rust" +qa
RUN nvim --headless +"TSInstallSync python" +qa
RUN nvim --headless +"TSInstallSync typescript" +qa
RUN nvim --headless +"TSInstallSync haskell" +qa

WORKDIR /home/vinh

##################################
## Various language tool chains ##
##################################

# Miniconda
RUN curl -LO https://repo.anaconda.com/miniconda/Miniconda3-py310_23.3.1-0-Linux-x86_64.sh
RUN bash ./Miniconda3-py310_23.3.1-0-Linux-x86_64.sh -b
RUN /home/vinh/miniconda3/bin/conda update -n base -c defaults conda
RUN /home/vinh/miniconda3/bin/conda config --set channel_priority strict

# rustup

# ghcup

################
## Sandbox!!! ##
################

RUN git clone https://github.com/Vinh-CHUC/sandbox.git
WORKDIR /home/vinh/sandbox
