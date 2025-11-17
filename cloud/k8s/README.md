## Kind
- `kubectl get pvc`
- `docker exec -it vinh-cluster-control-plane bash`
    - Usually one can find it in `/var/local-path-provisioner/`
- `docker inspect vinh-cluster-control-plane | jq '.[0].Mounts`
    - One can then see the local filepath that is mounted onto the `/var` in the kind container
