from dataclasses import dataclass, field
from pathlib import Path

from graphviz import Digraph
from manim import (
    BLACK,
    WHITE,
    Create,
    Ellipse,
    Graph,
    Scene,
    Square,
    Text,
    VGroup,
    config,
)

from maths.deep_learning.karpathy_zero_to_hero.micrograd import Op, Value

config.background_color = WHITE


def opnode_label(v: Value) -> str:
    match v.op:
        case Op.ADD:
            return "+"
        case Op.MUL:
            return "*"
        case None:
            raise ValueError()

def node_id(v: Value) -> str:
    return str(id(v))


class GraphVizRenderer:
    @staticmethod
    def _add_value_subgraph(dot: Digraph, v: Value) -> str | tuple[str, str]:
        dot.node(
            name=(value_node_id := node_id(v) + "_value"),
            label=f"{{{v.label or ""} | data={v.data} | grad={v.grad} }}",
            shape="record"
        )
        if v.op is not None:
            dot.node(
                name = (op_node_id := node_id(v)),
                label=opnode_label(v),
                shape="oval"
            )
            dot.edge(op_node_id, value_node_id)
            return op_node_id, value_node_id
        return value_node_id

    @staticmethod
    def _generate_graph_rec(dot: Digraph, v: Value, parent_id: str | None):
        node_ids = GraphVizRenderer._add_value_subgraph(dot, v)

        match node_ids:
            case (op_node_id, value_node_id):
                if parent_id is not None:
                    dot.edge(value_node_id, parent_id)
                for c in v.children:
                    GraphVizRenderer._generate_graph_rec(dot, c, op_node_id)
            case value_node_id:
                if parent_id is not None:
                    dot.edge(value_node_id, parent_id)

    def generate_graph(self, v: Value):
        dot = Digraph(comment='Micrograd graph', format='svg')
        dot.attr(rankdir='LR')

        self._generate_graph_rec(dot, v, None)

        return dot


class MicrogradNode(VGroup):
    def __init__(self, label: str = "", is_op: bool = False, **kwargs) -> None:
        super().__init__(**kwargs)
        shape = (
            Ellipse(width=0.8, height=0.5, fill_color=WHITE, fill_opacity=1, stroke_color=BLACK)
            if is_op
            else Square(side_length=1, fill_color=WHITE, fill_opacity=1, stroke_color=BLACK)
        )
        text = Text(label, font_size=12, color=BLACK)
        self.add(shape, text)


"""
Needs some more work
"""
@dataclass
class ManimRenderer(Scene):
    v: Value
    media_dir: Path = field(default_factory=lambda: Path(__file__).parent)

    def __post_init__(self):
        super().__init__()

    @staticmethod
    def _build_rec(
        v: Value,
        vertices: dict[str, dict],
        edges: list[tuple[str, str]],
        parent_id: str | None,
    ) -> None:
        value_id = node_id(v) + "_value"
        vertices[value_id] = {"label": v.label or f"data={v.data}", "is_op": False}

        if v.op is not None:
            op_id = node_id(v)
            vertices[op_id] = {"label": opnode_label(v), "is_op": True}
            edges.append((op_id, value_id))
            child_parent_id = op_id
        else:
            child_parent_id = value_id

        if parent_id is not None:
            edges.append((value_id, parent_id))

        for c in v.children:
            ManimRenderer._build_rec(c, vertices, edges, child_parent_id)

    @classmethod
    def _generate_graph(cls, v: Value) -> Graph:
        vertices: dict[str, dict] = {}
        edges: list[tuple[str, str]] = []
        cls._build_rec(v, vertices, edges, parent_id=None)

        return Graph(
            vertices=list(vertices.keys()),
            edges=edges,
            labels={vid: meta["label"] for vid, meta in vertices.items()},
            vertex_config={vid: {"is_op": meta["is_op"]} for vid, meta in vertices.items()},
            vertex_type=MicrogradNode,
            edge_config={"stroke_color": BLACK, "stroke_width": 1.5},
            layout="tree",
            layout_scale=3,
            root_vertex=node_id(v) + "_value",
        )

    def construct(self):
        self.play(Create(self._generate_graph(self.v)))
        self.wait(3)

    @classmethod
    def render_w(cls, v: Value):
        config.background_color = WHITE
        config.media_dir = Path(__file__).parent / "media"
        scene = cls(v)
        scene.render()
