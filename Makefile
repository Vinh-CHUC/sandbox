IMAGE_NAME = duyvinhchuc/sandbox:latest

build:
	podman build . -t $(IMAGE_NAME)
push:
	podman push $(IMAGE_NAME)
run:
	podman run -it $(IMAGE_NAME) zsh
rebuild: rm-containers prune build

rm-containers:
	podman ps --filter status=exited -q | xargs podman rm
prune:
	podman system prune -a
