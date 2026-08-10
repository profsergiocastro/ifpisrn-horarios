import React from 'react';
import clsx from 'clsx';
import {useLayoutDoc} from '@docusaurus/plugin-content-docs/client';
import NavbarNavLink from '@theme/NavbarItem/NavbarNavLink';

const CAMPUS_DOCS = [
  {
    docId: 'campus/administracao',
    label: 'Administração',
    className: 'campusInfoItem campusInfoItem--administracao',
  },
  {
    docId: 'campus/setor-de-saude',
    label: 'Setor de Saúde',
    className: 'campusInfoItem campusInfoItem--saude',
  },
  {
    docId: 'campus/calendario-academico',
    label: 'Calendário Acadêmico',
    className: 'campusInfoItem campusInfoItem--calendario',
  },
];

const COURSE_GROUPS = [
  {
    label: 'Técnico',
    className: 'campusCourseType campusCourseType--tecnico',
    docs: [
      {docId: 'cursos/tecnico-administracao-integrado', label: 'Administração (Integrado)'},
      {docId: 'cursos/tecnico-eventos-integrado', label: 'Eventos (Integrado)'},
      {docId: 'cursos/tecnico-informatica-integrado', label: 'Informática (Integrado)'},
      {docId: 'cursos/tecnico-administracao-subsequente', label: 'Administração (Subsequente)'},
      {docId: 'cursos/tecnico-gastronomia-subsequente', label: 'Gastronomia (Subsequente)'},
      {docId: 'cursos/tecnico-guia-de-turismo-subsequente', label: 'Guia de Turismo (Subsequente)'},
      {
        docId: 'cursos/tecnico-servico-de-restaurante-e-bar',
        label: 'Serviço de Restaurante e Bar (Subsequente)',
      },
      {docId: 'cursos/tecnico-gastronomia-proeja', label: 'Gastronomia (PROEJA)'},
    ],
  },
  {
    label: 'Licenciatura',
    className: 'campusCourseType campusCourseType--licenciatura',
    docs: [
      {docId: 'cursos/licenciatura-fisica', label: 'Licenciatura em Física'},
      {docId: 'cursos/licenciatura-matematica', label: 'Licenciatura em Matemática'},
    ],
  },
  {
    label: 'Tecnologia',
    className: 'campusCourseType campusCourseType--tecnologia',
    docs: [
      {docId: 'cursos/tecnologia-gastronomia', label: 'Gastronomia'},
      {docId: 'cursos/tecnologia-sistemas-para-internet', label: 'Sistemas para Internet'},
    ],
  },
];

function CampusDocLink({docId, label, className, onClick}) {
  const doc = useLayoutDoc(docId);
  if (doc === null) {
    return null;
  }
  return (
    <li className={clsx('menu__list-item', className)}>
      <NavbarNavLink
        isDropdownLink
        className="menu__link"
        activeClassName="menu__link--active"
        to={doc.path}
        label={label}
        onClick={onClick}
      />
    </li>
  );
}

function CampusGroup({label, className, children}) {
  return (
    <li className={clsx('menu__list-item', className)}>
      <details className="menu__list-item-collapsible">
        <summary className="menu__link menu__link--sublist menu__link--sublist-caret">
          {label}
        </summary>
        <ul className="menu__list">{children}</ul>
      </details>
    </li>
  );
}

export default function CampusInfoNavbarItem({
  mobile = false,
  position,
  className,
  onClick,
  ...props
}) {
  const Comp = mobile ? 'li' : 'div';
  return (
    <Comp
      className={clsx(
        mobile ? 'menu__list-item' : 'navbar__item',
        'campusInfoNavbarDropdown',
        className,
      )}>
      <details className="menu__list-item-collapsible">
        <summary className="menu__link menu__link--sublist menu__link--sublist-caret">
          Informações do Campus
        </summary>
        <ul className="menu__list">
          {CAMPUS_DOCS.map((doc) => (
            <CampusDocLink key={doc.docId} onClick={onClick} {...doc} />
          ))}
          <CampusGroup
            label="Cursos"
            className="campusInfoItem campusInfoItem--cursos">
            {COURSE_GROUPS.map((group) => (
              <CampusGroup
                key={group.label}
                label={group.label}
                className={group.className}>
                {group.docs.map((doc) => (
                  <CampusDocLink key={doc.docId} onClick={onClick} {...doc} />
                ))}
              </CampusGroup>
            ))}
          </CampusGroup>
          <CampusGroup
            label="Contato"
            className="campusInfoItem campusInfoItem--contato">
            <li className="menu__list-item">
              <div className="campusInfoSubItem campusInfoSubItem--telefone">
                <span className="campusInfoSubItem__label">Telefone</span>
                <span className="campusInfoSubItem__value">(89) 2221-9904</span>
              </div>
            </li>
            <li className="menu__list-item">
              <div className="campusInfoSubItem campusInfoSubItem--endereco">
                <span className="campusInfoSubItem__label">Endereço</span>
                <span className="campusInfoSubItem__value">BR 020, S/N, Bairro Primavera, São Raimundo Nonato - PI, CEP 64770-000</span>
              </div>
            </li>
          </CampusGroup>
        </ul>
      </details>
    </Comp>
  );
}
