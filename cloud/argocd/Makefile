#######################################
## Bootstrapping minikube and argocd ##
#######################################
minikube-reset:
	minikube delete
	minikube start
	minikube addons enable ingress

install-argocd:
	kubectl create namespace argocd
	kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Copy the printed password
argocd-printpassword:
	argocd admin initial-password -n argocd

# These are interactive you'll have to paste password
# Password has length requirements, I used "adminadmin" and that worked
argocd-changepassword:
	argocd login localhost:8080
	argocd account update-password

## Interacting with it
argocd-portforward:
	kubectl port-forward svc/argocd-server -n argocd 8080:443

#######################
## Dummy application ##
#######################
create-deployment:
	kubectl create deployment web --image=gcr.io/google-samples/hello-app:1.0
	## Minikube tunnetl only looks for LoadBalancer deployments
	kubectl expose deployment web --type=LoadBalancer --port=8080

## Exposing argocd **
expose-argocd:
	kubectl expose deployment argocd-server --type=LoadBalancer --port=80 --name=argocd-server-lb -n argocd

argocd-add-app:
	argocd app \
		create guestbook \
		--repo https://github.com/argoproj/argocd-example-apps.git \
	    --path guestbook \
		--dest-server https://kubernetes.default.svc \
		--dest-namespace default

sync-apps:
	REPO_PATH=$(shell git rev-parse --show-toplevel); \
	POD_NAME=$(shell kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-repo-server -o=jsonpath='{.items[0].metadata.name}'); \
	kubectl cp "$$REPO_PATH" "argocd/$$POD_NAME:/tmp/apps-repos/"

## Utilities to identify dependencies
print-apps-repos:
	kubectl get app -n argocd -o=jsonpath='{range .items[*].spec.source}{.repoURL}{"\n"}{end}'

print-apps-images:
	kubectl get pods --all-namespaces -o=jsonpath='{range .items[*].spec.containers[*]}{.image}{"\n"}{end}'

###############
## Arango DB ##
###############
helm-install-arangodb:
	helm install --generate-name https://github.com/arangodb/kube-arangodb/releases/download/1.2.39/kube-arangodb-1.2.39.tgz --set "operator.features.storage=true"
