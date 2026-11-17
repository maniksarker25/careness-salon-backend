/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';

import {
  AboutUs,
  ContactUs,
  FAQ,
  Imprint,
  PrivacyPolicy,
  Slider,
  TermsConditions,
} from './manage.model';
import AppError from '../../error/appError';

//! Imprint (single document, upserted)
const addImprint = async (payload: { description: string }) => {
  if (!payload?.description?.trim()) {
    throw new AppError(400, 'Imprint description is required');
  }
  return await Imprint.findOneAndUpdate(
    {},
    { description: payload.description },
    { new: true, upsert: true, runValidators: true },
  );
};
const getImprint = async () => {
  return await Imprint.findOne();
};

//! Shared helpers for per-app legal documents (customer app vs salon/client app)
export const LEGAL_APPS = ['customer', 'client'] as const;
export type TLegalApp = (typeof LEGAL_APPS)[number];

const LEGAL_APP_FIELD: Record<TLegalApp, string> = {
  customer: 'descriptionForCustomerApp',
  client: 'descriptionForClientApp',
};

const assertLegalApp = (app?: unknown): TLegalApp | undefined => {
  if (app === undefined || app === null || app === '') return undefined;
  if (!LEGAL_APPS.includes(app as TLegalApp)) {
    throw new AppError(
      400,
      `Invalid app "${String(app)}". Use one of: ${LEGAL_APPS.join(', ')}`,
    );
  }
  return app as TLegalApp;
};

// Keep only the string fields we allow to be written.
const pickStrings = (payload: any, allowed: string[]) => {
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (typeof payload?.[key] === 'string') update[key] = payload[key];
  }
  return update;
};

// Shape returned to the mobile apps when they ask for one app's document.
const toAppDocument = (
  doc: any,
  app: TLegalApp,
  legacyFallback?: string,
) => ({
  _id: doc?._id,
  app,
  description: doc?.[LEGAL_APP_FIELD[app]] || legacyFallback || '',
  updatedAt: doc?.updatedAt,
});

//! Privacy and policy
const addPrivacyPolicy = async (payload: any) => {
  const update = pickStrings(payload, [
    'description',
    'descriptionForCustomerApp',
    'descriptionForClientApp',
  ]);
  if (!Object.keys(update).length) {
    throw new AppError(400, 'Privacy policy content is required');
  }
  // Older app builds only read `description`; keep it in sync with the
  // customer policy so they still show a valid text.
  if (update.descriptionForCustomerApp !== undefined) {
    update.description = update.descriptionForCustomerApp;
  }
  return await PrivacyPolicy.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, runValidators: true },
  );
};
const getPrivacyPolicy = async (app?: unknown) => {
  const legalApp = assertLegalApp(app);
  const doc: any = await PrivacyPolicy.findOne().lean();
  if (!legalApp) return doc;
  return toAppDocument(doc, legalApp, doc?.description);
};
const editPrivacyPolicy = async (
  id: string,
  payload: { description: string },
) => {
  const isExist = await PrivacyPolicy.findById(id);
  if (!isExist) {
    throw new AppError(404, 'Privacy Policy not found');
  }
  const result = await PrivacyPolicy.findOneAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};
const deletePrivacyPolicy = async (id: string) => {
  const isExist = await PrivacyPolicy.findById(id);
  if (!isExist) {
    throw new AppError(404, 'Privacy Policy not found');
  }
  return await PrivacyPolicy.findByIdAndDelete(id);
};
//! About us
const addAboutUs = async (payload: any) => {
  const checkIsExist = await AboutUs.findOne();
  if (checkIsExist) {
    await AboutUs.findOneAndUpdate({}, payload, {
      new: true,

      runValidators: true,
    });
  } else {
    return await AboutUs.create(payload);
  }
};
const getAboutUs = async () => {
  return await AboutUs.findOne();
};
const editAboutUs = async (id: string, payload: { description: string }) => {
  const isExist = await AboutUs.findById(id);
  if (!isExist) {
    throw new AppError(404, 'AboutUs not found');
  }
  const result = await AboutUs.findOneAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};
const deleteAboutUs = async (id: string) => {
  const isExist = await AboutUs.findById(id);
  if (!isExist) {
    throw new AppError(404, 'AboutUs not found');
  }
  return await AboutUs.findByIdAndDelete(id);
};
//! Terms Conditions
const addTermsConditions = async (payload: any) => {
  const update = pickStrings(payload, [
    'descriptionForCustomerApp',
    'descriptionForClientApp',
  ]);
  if (!Object.keys(update).length) {
    throw new AppError(400, 'Terms and conditions content is required');
  }
  return await TermsConditions.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, runValidators: true },
  );
};
const getTermsConditions = async (app?: unknown) => {
  const legalApp = assertLegalApp(app);
  const doc: any = await TermsConditions.findOne().lean();
  if (!legalApp) return doc;
  return toAppDocument(doc, legalApp);
};
const editTermsConditions = async (
  id: string,
  payload: { description: string },
) => {
  const isExist = await TermsConditions.findById(id);
  if (!isExist) {
    throw new AppError(404, 'TermsConditions not found');
  }
  const result = await TermsConditions.findOneAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};
const deleteTermsConditions = async (id: string) => {
  const isExist = await TermsConditions.findById(id);
  if (!isExist) {
    throw new AppError(404, 'TermsConditions not found');
  }
  return await TermsConditions.findByIdAndDelete(id);
};

//! Contact Us
const addContactUs = async (payload: any) => {
  return await ContactUs.create(payload);
};
const getContactUs = async () => {
  return await ContactUs.findOne();
};
const editContactUs = async (id: string, payload: { description: string }) => {
  const isExist = await ContactUs.findById(id);
  if (!isExist) {
    throw new AppError(404, 'ContactUs not found');
  }
  const result = await ContactUs.findOneAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};
const deleteContactUs = async (id: string) => {
  const isExist = await ContactUs.findById(id);
  if (!isExist) {
    throw new AppError(404, 'ContactUs not found');
  }
  return await ContactUs.findByIdAndDelete(id);
};
//! FAQ
const addFAQ = async (payload: any) => {
  return await FAQ.create(payload);
};
const getFAQ = async () => {
  return await FAQ.find({});
};
const editFAQ = async (
  id: string,
  payload: { question: string; answer: string },
) => {
  const isExist = await FAQ.findById(id);
  if (!isExist) {
    throw new AppError(404, 'Faq not found');
  }
  const result = await FAQ.findOneAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};
const deleteFAQ = async (id: string) => {
  const isExist = await FAQ.findById(id);
  if (!isExist) {
    throw new AppError(404, 'Faq not found');
  }
  return await FAQ.findByIdAndDelete(id);
};
//! Slider
const addSlider = async (req: Request) => {
  const { files, body } = req;

  let image = undefined;
  //@ts-ignore
  if (files && files.image) {
    //@ts-ignore
    image = `/images/image/${files.image[0].filename}`;
  }

  const result = await Slider.create({
    image,
    ...body,
  });
  return result;
};
const getSlider = async () => {
  return await Slider.find({});
};
const editSlider = async (req: Request) => {
  const { files, body } = req;
  const { id } = req.params;
  // console.log(body);
  let image = undefined;
  //@ts-ignore
  if (files && files.image) {
    //@ts-ignore
    image = `/images/image/${files.image[0].filename}`;
  }

  const isExist = await Slider.findById(id);
  if (!isExist) {
    throw new AppError(404, 'Slider program not found');
  }
  const { ...updateData } = body;
  // console.log(updateData);
  const result = await Slider.findOneAndUpdate(
    { _id: id },
    {
      image,
      ...updateData,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  return result;
};
const deleteSlider = async (id: string) => {
  const isExist = await Slider.findById(id);
  if (!isExist) {
    throw new AppError(404, 'Slider not found');
  }
  return await Slider.findByIdAndDelete(id);
};

export const ManageService = {
  addImprint,
  getImprint,
  addPrivacyPolicy,
  addAboutUs,
  addTermsConditions,
  addContactUs,
  getPrivacyPolicy,
  getAboutUs,
  getTermsConditions,
  getContactUs,
  editPrivacyPolicy,
  editAboutUs,
  editTermsConditions,
  editContactUs,
  deleteAboutUs,
  deleteContactUs,
  deletePrivacyPolicy,
  deleteTermsConditions,
  addFAQ,
  getFAQ,
  editFAQ,
  deleteFAQ,
  addSlider,
  getSlider,
  deleteSlider,
  editSlider,
};
