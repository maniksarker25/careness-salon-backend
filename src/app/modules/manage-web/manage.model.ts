import mongoose, { model } from 'mongoose';

//! Privacy and policy
// Customers and salon owners (clients) get separate policies. `description`
// is the legacy single policy; it mirrors the customer policy so older app
// builds that only read `description` keep working.
const privacySchema = new mongoose.Schema(
  {
    description: {
      type: String,
    },
    descriptionForCustomerApp: {
      type: String,
    },
    descriptionForClientApp: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
//! About US
const aboutUsSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
//! Imprint (Impressum, required in Germany by § 5 DDG)
const imprintSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
//! Terms Conditions
const termsAndConditionsSchema = new mongoose.Schema(
  {
    descriptionForCustomerApp: {
      type: String,
      // required: true,
    },
    descriptionForClientApp: {
      type: String,
      // required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
//!Contact US
const contactUsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
//!FAQ
const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
//!Slider
const sliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);
export const PrivacyPolicy = model('PrivacyPolicy', privacySchema);
export const AboutUs = model('AboutUs', aboutUsSchema);
export const Imprint = model('Imprint', imprintSchema);
export const TermsConditions = model(
  'TermsConditions',
  termsAndConditionsSchema,
);
export const ContactUs = model('ContactUs', contactUsSchema);
export const FAQ = model('FAQ', faqSchema);
export const Slider = model('Slider', sliderSchema);
