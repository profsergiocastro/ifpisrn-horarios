/**
 * Links para páginas de cursos já existentes na seção institucional do site.
 * Esta lista alimenta apenas a seção opcional de acesso rápido da página inicial.
 */
import React from 'react'

import type { Props as Course } from '../components/Course'

export type CourseItem = Course & {
  showOnHomepage: boolean
}

const COURSES: CourseItem[] = [
  {
    url: '/docs/cursos/tecnico-administracao-integrado',
    name: 'Técnico em Administração Integrado',
    acronym: 'Administração Integrado',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnico-eventos-integrado',
    name: 'Técnico em Eventos Integrado',
    acronym: 'Eventos Integrado',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnico-informatica-integrado',
    name: 'Técnico em Informática Integrado',
    acronym: 'Informática Integrado',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnico-administracao-subsequente',
    name: 'Técnico em Administração Subsequente',
    acronym: 'Administração Subsequente',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnico-gastronomia-subsequente',
    name: 'Técnico em Gastronomia Subsequente',
    acronym: 'Gastronomia Subsequente',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnico-guia-de-turismo-subsequente',
    name: 'Técnico em Guia de Turismo Subsequente',
    acronym: 'Guia de Turismo',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnico-servico-de-restaurante-e-bar',
    name: 'Técnico em Serviço de Restaurante e Bar',
    acronym: 'Restaurante e Bar',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnico-gastronomia-proeja',
    name: 'Técnico em Gastronomia PROEJA',
    acronym: 'Gastronomia PROEJA',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/licenciatura-fisica',
    name: 'Licenciatura em Física',
    acronym: 'Licenciatura em Física',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/licenciatura-matematica',
    name: 'Licenciatura em Matemática',
    acronym: 'Licenciatura em Matemática',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnologia-gastronomia',
    name: 'Tecnologia em Gastronomia',
    acronym: 'Tecnologia em Gastronomia',
    showOnHomepage: true,
  },
  {
    url: '/docs/cursos/tecnologia-sistemas-para-internet',
    name: 'Tecnologia em Sistemas para Internet',
    acronym: 'Sistemas para Internet',
    showOnHomepage: true,
  },
]

export default COURSES
