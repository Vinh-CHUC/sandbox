#include <list>
#include <memory>
#include <optional>

template <typename T> struct TreeNode {
  T val;
  std::shared_ptr<TreeNode> left;
  std::shared_ptr<TreeNode> right;

  std::list<T> inorder() const {
    auto ret = std::list<T>{};
    if (left != nullptr) {
      ret.splice(ret.end(), left->inorder());
    }
    ret.insert(val);
    if (right != nullptr) {
      ret.splice(ret.end(), right->inorder());
    }
  }

  std::list<T> preorder() const {
    auto ret = std::list<T>{};
    ret.insert(val);
    if (left != nullptr) {
      ret.splice(ret.end(), left->inorder());
    }
    if (right != nullptr) {
      ret.splice(ret.end(), right->inorder());
    }
  }

  std::list<T> postorder() const {
    auto ret = std::list<T>{};
    if (left != nullptr) {
      ret.splice(ret.end(), left->inorder());
    }
    if (right != nullptr) {
      ret.splice(ret.end(), right->inorder());
    }
    ret.insert(val);
  }

  std::list<T> breadthfirst() {
    auto ret = std::list<T>{val};

    std::list<std::shared_ptr<TreeNode>> nodes_to_process{left, right};

    while (!nodes_to_process.empty()) {
      auto node = nodes_to_process.front();
      nodes_to_process.pop_front();
      if (node != nullptr) {
        ret.push_back(node->val);
        nodes_to_process.push_back(node->left);
        nodes_to_process.push_back(node->right);
      }
    }
    return ret;
  }

  static std::shared_ptr<TreeNode>
  from_breadthfirst(std::list<std::optional<T>> vals) {
    if (vals.empty()) {
      return nullptr;
    }

    auto v_opt = vals.front();
    vals.pop_front();

    auto root = std::make_shared<TreeNode>(v_opt.value());

    // Nodes that might have their left/right subtrees populated
    std::list<std::shared_ptr<TreeNode>> nodes_to_process{root};

    while (!vals.empty()) {
      auto v_opt = vals.front();
      vals.pop_front();

      auto node = nodes_to_process.front();
      nodes_to_process.pop_front();

      if (v_opt) {
        node->left = std::make_shared<TreeNode>(v_opt.value());
        nodes_to_process.push_back(node->left);
      }

      if (!vals.empty()) {
        auto v_opt = vals.front();
        vals.pop_front();
        if (v_opt) {
          node->right = std::make_shared<TreeNode>(v_opt.value());
          nodes_to_process.push_back(node->right);
        }
      }
    }

    return root;
  }
};

template <typename T> struct LCAHelper {
  std::optional<std::shared_ptr<TreeNode<T>>> lca;
  bool found_a{false};
  bool found_b{false};
};

template <typename T>
LCAHelper<T> do_lowestCommonAncestor(std::shared_ptr<TreeNode<T>> tree, T a,
                                     T b) {
  if (tree == nullptr) {
    return LCAHelper<T>{};
  }

  auto lca_left = do_lowestCommonAncestor(tree->left, a, b);
  auto lca_right = do_lowestCommonAncestor(tree->right, a, b);

  if (lca_left.lca) {
    return lca_left;
  } else if (lca_right.lca) {
    return lca_right;
  } else {
    auto found_a = (lca_left.found_a || lca_right.found_a || tree->val == a);
    auto found_b = (lca_left.found_b || lca_right.found_b || tree->val == b);

    return LCAHelper<T>{
        .lca = ((found_a && found_b)
                    ? std::optional<std::shared_ptr<TreeNode<T>>>{tree}
                    : std::nullopt),
        .found_a = found_a,
        .found_b = found_b,
    };
  }
}

template <typename T>
std::optional<std::shared_ptr<TreeNode<T>>>
lowestCommonAncestor(std::shared_ptr<TreeNode<T>> tree, T a, T b) {
  auto lca = do_lowestCommonAncestor(tree, a, b);
  return lca.lca;
}
