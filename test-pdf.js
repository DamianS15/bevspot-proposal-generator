import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
try {
  const doc = new jsPDF();
  if (typeof doc.autoTable !== 'function') {
    console.error('doc.autoTable is not a function');
  } else {
    console.log('doc.autoTable exists!');
  }
} catch (e) {
  console.error(e);
}
