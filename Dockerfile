FROM ubuntu:lunar
RUN apt-get update && apt-get install -y --no-install-recommends
RUN apt-get install -y git gh build-essential curl gawk sudo tmux tree zsh && apt-get clean
RUN apt-get install -y bat fd-find ripgrep

# Install neovim
RUN curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim.appimage
RUN chmod u+x nvim.appimage
RUN ./nvim.appimage --appimage-extract
RUN chmod a+x ./squashfs-root/usr/bin/nvim
RUN ln -s $(pwd)/squashfs-root/usr/bin/nvim /usr/local/bin/nvim

RUN useradd -ms /bin/zsh vinh
RUN usermod -aG sudo vinh
RUN echo vinh:vinh | chpasswd
USER vinh

##################################
## Various language tool chains ##
##################################
WORKDIR /home/vinh
RUN git clone https://github.com/Vinh-CHUC/sandbox.git
RUN git clone --recursive https://github.com/Vinh-CHUC/config-files.git

WORKDIR /home/vinh/sandbox

# Miniconda
RUN curl -LO https://repo.anaconda.com/miniconda/Miniconda3-py310_23.3.1-0-Linux-x86_64.sh
RUN bash ./Miniconda3-py310_23.3.1-0-Linux-x86_64.sh -b
RUN /home/vinh/miniconda3/bin/conda update -n base -c defaults conda
RUN /home/vinh/miniconda3/bin/conda config --set channel_priority strict

RUN /home/vinh/miniconda3/bin/conda env create -f bayesian_statistics/python/conda.yml
WORKDIR /home/vinh/config-files
RUN PATH=$PATH:/home/vinh/miniconda3/envs/bayes/bin make setup-ipython

# haskell stack
USER root
RUN apt-get install -y libtinfo-dev

USER vinh
WORKDIR /home/vinh/sandbox/languages/haskell/haskell-playground
RUN curl -sSL https://get.haskellstack.org/ -o get_haskellstack
RUN chmod a+x get_haskellstack
RUN echo vinh | sudo -S ./get_haskellstack
RUN rm get_haskellstack
RUN stack build

# rustup
RUN curl https://sh.rustup.rs -sSf | sh -s -- --no-modify-path -y
RUN PATH=$PATH:/home/vinh/.cargo/bin rustup component add rust-analyzer
RUN PATH=$PATH:/home/vinh/.cargo/bin cargo install ttyper
WORKDIR /home/vinh/sandbox/languages/rust
RUN cd rust_playground && PATH=$PATH:/home/vinh/.cargo/bin cargo build

##################
## Touch Typing ##
##################
RUN PATH=$PATH:/home/vinh/.cargo/bin cargo install ttyper

############
## EBooks ##
############
WORKDIR /home/vinh/ebooks
RUN PATH=$PATH:/home/vinh/.cargo/bin cargo install mdbook mdbook-linkcheck
RUN PATH=$PATH:/home/vinh/.cargo/bin rustup component add rust-docs
RUN git clone https://github.com/sunface/rust-by-practice.git
RUN git clone https://github.com/rust-lang/rust-by-example
RUN git clone https://github.com/rust-lang/async-book.git
RUN curl -LO https://docs.python.org/3/archives/python-3.11.4-docs-html.tar.bz2

###########################
# Development environment #
###########################
WORKDIR /home/vinh/config-files
RUN make setup-nvim setup-tmux setup-tmux-tpm setup-git setup-zsh
RUN nvim --headless -c 'autocmd User PackerComplete quitall' -c 'PackerSync'
RUN nvim --headless -c 'autocmd User PackerComplete quitall' -c 'PackerSync'
RUN nvim --headless +"TSInstallSync rust" +qa
RUN nvim --headless +"TSInstallSync python" +qa
RUN nvim --headless +"TSInstallSync typescript" +qa
RUN nvim --headless +"TSInstallSync haskell" +qa
RUN nvim --headless +"TSInstallSync org" +qa

WORKDIR /home/vinh/sandbox
