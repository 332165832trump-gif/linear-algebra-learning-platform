import { describe, expect, it } from "vitest";
import { modules } from "./modules.js";

const requiredFields = [
  "definition",
  "geometry",
  "history",
  "why",
  "application",
  "beginner",
  "rigorous",
  "misconception",
  "formula",
  "visualHint",
  "coreQuestion"
];

describe("course modules", () => {
  it("covers the complete requested high algebra map", () => {
    expect(modules).toHaveLength(19);
    expect(modules.map((module) => module.title)).toEqual([
      "向量",
      "向量空间",
      "子空间",
      "线性相关与线性无关",
      "基与维数",
      "线性变换",
      "矩阵",
      "矩阵乘法",
      "秩",
      "行列式",
      "特征值",
      "特征向量",
      "对角化",
      "二次型",
      "内积空间",
      "正交化",
      "Jordan 标准型",
      "PCA",
      "线性方程组"
    ]);
  });

  it("gives every module the required teaching structure", () => {
    for (const module of modules) {
      for (const field of requiredFields) {
        expect(module[field], `${module.title}.${field}`).toBeTruthy();
      }
      expect(module.story, module.title).toHaveLength(5);
      expect(module.story.map((stage) => stage.label)).toEqual([
        "观察现象",
        "提出问题",
        "为什么会这样",
        "抽象出定义",
        "走向应用"
      ]);
    }
  });
});
