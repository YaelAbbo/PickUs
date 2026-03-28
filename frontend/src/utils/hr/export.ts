import type { User } from '@/api/user';
import { i18n } from '@/i18n';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export const exportEmployeesToExcel = async (users: User[]) => {
  if (users.length === 0) {
    throw new Error('No users to export');
  }

  const exportData = users.map((u) => ({
    [i18n.hr_table.first_name]: u.firstName,
    [i18n.hr_table.last_name]: u.lastName,
    [i18n.hr_table.role]: i18n.roles[u.role as keyof typeof i18n.roles] || u.role,
    [i18n.hr_table.org_id]: u.orgId,
    [i18n.hr_table.created_at]: new Date(u.createdAt).toLocaleDateString(),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, i18n.hr_table.title);

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const file = new File(Paths.cache, `pickus_employees_${Date.now()}.xlsx`);

  file.write(wbout, { encoding: 'base64' });

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: i18n.hr_actions.export_to_excel,
    UTI: 'com.microsoft.excel.xlsx',
  });
};
