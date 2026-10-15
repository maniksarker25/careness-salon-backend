import config from '../config';

const registrationSuccessEmailBody = (
  name: string,
  activationCode: number,
): string => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Activate Your Account - Carenes</title>
    <style type="text/css">
      body {
        margin: 0 !important;
        padding: 0 !important;
        background-color: #f8fafc !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        -webkit-font-smoothing: antialiased;
        -ms-text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
      }
      table {
        border-collapse: collapse !important;
      }
      a {
        text-decoration: none;
      }
      @media only screen and (max-width: 620px) {
        .email-container {
          width: 100% !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }
        .content-padding {
          padding: 24px 20px !important;
        }
        .header-padding {
          padding: 32px 20px 16px 20px !important;
        }
        .code-digits {
          font-size: 28px !important;
          letter-spacing: 6px !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <!-- Background Canvas -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; table-layout: fixed;">
      <tr>
        <td align="center" style="padding: 40px 15px;">
          <!-- Card Container -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- Brand Header -->
            <tr>
              <td align="center" class="header-padding" style="padding: 36px 40px 20px 40px; background-color: #ffffff; text-align: center;">
                <img
                  src="${config.logo_url}"
                  alt="Carenes - Look Good Feel Good"
                  width="180"
                  style="display: block; width: 180px; max-width: 100%; height: auto; margin: 0 auto; border: 0; outline: none; text-decoration: none; border-radius: 8px;"
                />
              </td>
            </tr>

            <!-- Divider Line -->
            <tr>
              <td style="padding: 0 40px;">
                <div style="height: 1px; background-color: #f1f5f9; width: 100%;"></div>
              </td>
            </tr>

            <!-- Main Content Area -->
            <tr>
              <td class="content-padding" style="padding: 32px 40px; background-color: #ffffff;">
                <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                  Verify Your Account
                </h1>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Hello ${name ? name : 'there'},
                </p>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  Thank you for registering with <strong>Carenes</strong>. To activate your account and start booking, please enter this verification code in the app:
                </p>

                <!-- Code Card -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdfa; border: 1.5px dashed #0D9488; border-radius: 12px; margin: 24px 0;">
                  <tr>
                    <td align="center" style="padding: 24px 20px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #0f766e; text-transform: uppercase; margin-bottom: 8px;">
                        Verification Code
                      </div>
                      <div class="code-digits" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0D9488; padding: 6px 0; line-height: 1.1;">
                        ${activationCode ? activationCode : '------'}
                      </div>
                      <div style="font-size: 12px; font-weight: 500; color: #64748B; margin-top: 8px;">
                        Expires in <strong>10 minutes</strong>
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                  Enter this code on the activation screen within 10 minutes to verify your account.
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                  If you didn't create an account with Carenes, please disregard this email.
                </p>
              </td>
            </tr>

            <!-- Footer Area -->
            <tr>
              <td align="center" style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  This is an automated message from <strong>Carenes</strong>. Please do not reply directly to this email.
                </p>
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                  &copy; ${new Date().getFullYear()} Carenes. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export default registrationSuccessEmailBody;
