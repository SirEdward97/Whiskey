const CHAPTERS = [
  { id: 'inicio', title: 'Inicio', label: '01 Inicio' },
  { id: 'perfil', title: 'Perfil', label: '02 Perfil' },
  { id: 'proyectos', title: 'Proyectos', label: '03 Proyectos' },
  { id: 'stack', title: 'Stack 3D', label: '04 Stack' },
  { id: 'contacto', title: 'Contacto', label: '05 Contacto' },
];

export default function ChapterRail({ activeSection }) {
  return (
    <aside className="chapter-rail" aria-label="Progreso por secciones">
      {CHAPTERS.map((chapter) => (
        <a
          key={chapter.id}
          href={`#${chapter.id}`}
          className={`chapter-dot${activeSection === chapter.id ? ' active' : ''}`}
          data-chapter={chapter.id}
          title={chapter.title}
        >
          <span className="chapter-label">{chapter.label}</span>
          <span className="chapter-pip" />
        </a>
      ))}
    </aside>
  );
}
