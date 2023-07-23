IMAGE_NAME = duyvinhchuc/sandbox:latest

build:
	podman build . -t $(IMAGE_NAME)
push:
	podman push $(IMAGE_NAME)
run:
	podman run \
		--privileged \
		-p 8000:8000 \
		-it \
		-e DISPLAY=host.containers.internal:0 \
		$(IMAGE_NAME) \
		zsh

rebuild: rm-containers prune build

rm-containers:
	podman ps --filter status=exited -q | xargs podman rm
prune:
	podman system prune -a

machine-big:
	podman machine set --memory=8192
	podman machine set --cpus=2

machine-small:
	podman machine set --memory=4096
	podman machine set --cpus=1

osx_install_xquartz:
	brew cask install xquartz
	/opt/X11/bin/xhost + 127.0.0.1
