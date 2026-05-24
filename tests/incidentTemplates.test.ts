import { describe, expect, it } from 'vitest';
import { incidentTemplates } from '../src/data/incidentTemplates';

const newFunnyIncidentTitles = [
  '{actor} 的 AI 模型要求加薪',
  '{actor} 把猫咪图片混进训练集',
  '{actor} 训练出阴阳怪气 AI 客服',
  '{actor} 发现 GPU 服务器在挖矿',
  '{actor} 写出只有 AI 看得懂的代码',
  '{actor} 把团建办成吐槽大会',
  '{actor} 让实习生碰了生产库',
  '{actor} 发现竞争对手的橘猫间谍',
  '{actor} 把离职感言发到公司群',
  '{actor} 围观 AI 伦理官和模型吵架',
];

describe('incidentTemplates', () => {
  it('includes the new funny AI and office incident templates', () => {
    const titles = incidentTemplates.map((template) => template.titleTemplate);

    for (const title of newFunnyIncidentTitles) {
      expect(titles).toContain(title);
    }
  });

  it('keeps the new funny incident effects balanced', () => {
    const newTemplates = incidentTemplates.filter((template) =>
      newFunnyIncidentTitles.includes(template.titleTemplate),
    );

    expect(newTemplates).toHaveLength(10);

    for (const template of newTemplates) {
      const description = template.descriptionTemplate('测试员');
      expect(description).toContain('测试员');
      expect(Math.abs(template.effects.progress)).toBeLessThanOrEqual(8);
      expect(Math.abs(template.effects.bugs)).toBeLessThanOrEqual(7);
      expect(Math.abs(template.effects.techDebt)).toBeLessThanOrEqual(8);
      expect(Math.abs(template.effects.morale)).toBeLessThanOrEqual(8);
    }
  });
});
