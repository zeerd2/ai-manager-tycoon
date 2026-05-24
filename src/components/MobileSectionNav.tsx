export type MainSectionId = 'team' | 'project' | 'strategy' | 'achievement' | 'history';

interface MainSection {
  id: MainSectionId;
  label: string;
}

interface Props {
  sections: MainSection[];
  activeSection: MainSectionId | null;
  onSelect: (id: MainSectionId) => void;
}

export function MobileSectionNav({ sections, activeSection, onSelect }: Props) {
  return (
    <nav className="mobile-section-nav mobile-bottom-nav" aria-label="移动端底部功能导航">
      <div className="mobile-section-tabs" role="tablist">
        {sections.map(section => (
          <button
            key={section.id}
            type="button"
            className={`mobile-section-tab ${activeSection === section.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeSection === section.id}
            aria-controls="mobile-secondary-panel"
            onClick={() => onSelect(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
