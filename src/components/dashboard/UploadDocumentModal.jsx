import { useState } from 'react';
import { useDocumentActions } from '../../hooks/useDocumentActions.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

const documentTypeOptions = [
  'Degree Certificate',
  'Transcript',
  'Enrollment Letter',
  'Internship Letter',
  'Address Proof',
  'Other',
];

const initialFormState = {
  documentName: '',
  institution: '',
  documentType: documentTypeOptions[0],
  fileName: '',
};

export default function UploadDocumentModal({ isOpen, onClose }) {
  const { uploadDocument } = useDocumentActions();
  const [form, setForm] = useState(initialFormState);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setForm((current) => ({
      ...current,
      fileName: file ? file.name : '',
    }));
  };

  const handleClose = () => {
    setForm(initialFormState);
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    uploadDocument({
      documentName: form.documentName.trim(),
      institution: form.institution.trim(),
      documentType: form.documentType,
      fileName: form.fileName.trim() || `${form.documentName.trim() || 'document'}.pdf`,
    });

    handleClose();
  };

  const isSubmitDisabled =
    !form.documentName.trim() || !form.institution.trim() || !form.documentType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5">
      <Card className="w-full max-w-lg p-6 sm:p-8">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-950">Upload Document</h2>
          <p className="mt-1 text-sm text-slate-500">
            Submit a document for institution verification.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Document Name</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none focus:border-blue-700"
              name="documentName"
              onChange={handleChange}
              required
              type="text"
              value={form.documentName}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Institution</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none focus:border-blue-700"
              name="institution"
              onChange={handleChange}
              required
              type="text"
              value={form.institution}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Document Type</span>
            <select
              className="mt-2 w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-950 outline-none focus:border-blue-700"
              name="documentType"
              onChange={handleChange}
              required
              value={form.documentType}
            >
              {documentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Upload File</span>
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700"
              onChange={handleFileChange}
              type="file"
            />
            {form.fileName ? (
              <p className="mt-2 text-xs text-slate-500">Selected: {form.fileName}</p>
            ) : null}
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button onClick={handleClose} type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={isSubmitDisabled} type="submit">
              Submit
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
