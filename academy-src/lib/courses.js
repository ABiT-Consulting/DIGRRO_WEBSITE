// Loads live course metadata for checkout without rendering a repeated plan section.

const COURSES_API = './api/courses.php';

export async function loadCourses() {
  try {
    const res = await fetch(COURSES_API, { headers: { Accept: 'application/json' } });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];

    const data = await res.json();
    if (!res.ok || !data || !data.ok || !Array.isArray(data.courses)) return [];

    return data.courses
      .slice()
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (err) {
    return [];
  }
}
