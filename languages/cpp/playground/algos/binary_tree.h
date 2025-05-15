#include <list>
#include <memory>

template<typename T>
struct TreeNode {
  T val;
  std::shared_ptr<TreeNode> left;
  std::shared_ptr<TreeNode> right;

  std::list<T> inorder() const {
    auto ret = std::list<T>{};
    if (left != nullptr){
      ret.splice(ret.end(), left->inorder());
    }
    ret.insert(val); 
    if (right != nullptr){
      ret.splice(ret.end(), right->inorder());
    }
  }

  std::list<T> preorder() const {
    auto ret = std::list<T>{};
    ret.insert(val); 
    if (left != nullptr){
      ret.splice(ret.end(), left->inorder());
    }
    if (right != nullptr){
      ret.splice(ret.end(), right->inorder());
    }
  }

  std::list<T> postorder() const {
    auto ret = std::list<T>{};
    if (left != nullptr){
      ret.splice(ret.end(), left->inorder());
    }
    if (right != nullptr){
      ret.splice(ret.end(), right->inorder());
    }
    ret.insert(val); 
  }

  std::list<T> breadthfirst(){
    auto ret = std::list<T>{val};

    std::list<std::shared_ptr<TreeNode>> nodes_to_process{left, right};

    while(!nodes_to_process.empty()){
      auto node = nodes_to_process.front(); 
      nodes_to_process.pop_front();
      if (node != nullptr){
        ret.push_back(node->val);
        nodes_to_process.push_back(node->left);
        nodes_to_process.push_back(node->right);
      }
    }
    return ret;
  }

  static std::shared_ptr<TreeNode> from_breadthfirst(std::list<T> vals){
    if (vals.empty()){
      return nullptr;
    }

    auto v = vals.front();
    vals.pop_front();

    auto root = std::make_shared<TreeNode>(v);

    // Nodes that might have their left/right subtrees populated
    std::list<std::shared_ptr<TreeNode>> nodes_to_process{root};


    while(!vals.empty()){
      auto v = vals.front();
      vals.pop_front();

      auto node = nodes_to_process.front();
      nodes_to_process.pop_front();

      node->left = std::make_shared<TreeNode>(v);
      nodes_to_process.push_back(node->left);

      if (!vals.empty()){
        auto v = vals.front();
        vals.pop_front();
        node->right = std::make_shared<TreeNode>(v);
        nodes_to_process.push_back(node->right);
      }
    }

    return root;
  }
};
