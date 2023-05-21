IMAGE_NAME = duyvinhchuc/sandbox:latest

build:
	docker build . -t $(IMAGE_NAME)
push:
	docker push $(IMAGE_NAME)
run:
	docker run -it $(IMAGE_NAME) zsh
