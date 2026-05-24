export type MainSectionId = 'team' | 'project' | 'strategy' | 'result' | 'history';

interface MainSection {
  id: MainSectionId;
  label: string;
}

interface Props {
  sections: MainSection[];
  activeSection: MainSectionId;
  onSelect: (id: MainSectionId) => void;
}

export function MobileSectionNav({ sections, activeSection, onSelect }: Props) {
  return (
    <nav className="mobile-section-nav" aria-label="移动端主界面导航">
      <div className="mobile-section-tabs" role="tablist">
        {sections.map(section => (
          <button
            key={section.id}
            type="button"
            className={`mobile-section-tab ${activeSection === section.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeSection === section.id}
            aria-controls={`main-section-${section.id}`}
            onClick={() => onSelect(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
