import React, { useContext, useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { ButtonPrimary, Text, ButtonDanger } from "@primer/components";
import auth from "solid-auth-client";
import { Session } from "@inrupt/solid-client-authn-browser";

import {
  solidProfile,
  SolidProfileShape,
  EmailShape,
  EmailShapeCreateArgs,
} from "../../generated/shex";
import { SessionContext } from "../../SessionContext";

import { FormSection } from "./_components/FormSection";
import styles from "./Profile.module.css";

export const Profile: React.FC = () => {
  const { info, fetch } = useContext(SessionContext) as Session & {
    info: { webId: string };
  };
  const [profile, setProfile] = useState<Partial<SolidProfileShape> | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { webId } = info;

  useEffect(() => {
    solidProfile.fetcher._fetch = fetch;
    solidProfile
      .findOne({
        from: webId,
        where: { id: webId },
      })
      .then(({ data, errors }) => {
        if (errors) {
          setError(errors[0]);
        } else if (data) {
          setProfile(data);
        }
      });
  }, [webId, fetch]);

  if (error) {
    return <div>{error}</div>;
  } else if (!profile) {
    return <div>Loading...</div>;
  } else if (isSubmitting) {
    return <div>Updating...</div>;
  }

  const { name, hasEmail } = profile as SolidProfileShape;

  return (
    <>
      <Text fontSize="2em" marginBottom="16px">
        Hello, {name}
      </Text>
      <Formik
        initialValues={{
          name,
          email: ((hasEmail as EmailShape)?.value as string)?.replace(
            "mailto:",
            ""
          ),
        }}
        onSubmit={async (data) => {
          setIsSubmitting(true);
          const { data: newProfile } = await solidProfile.update({
            doc: webId,
            data: {
              id: webId,
              name: data.name,
              hasEmail: {
                value: data.email && new URL("mailto:" + data.email),
              } as EmailShapeCreateArgs,
            },
          });
          setProfile(newProfile as Partial<SolidProfileShape>);
          setIsSubmitting(false);
        }}
      >
        {({ values, handleChange, dirty, touched }) => (
          <Form>
            <FormSection
              label="Name"
              name="name"
              defaultValue={values.name as string}
              onChange={handleChange}
            />
            <FormSection
              label="Email"
              name="email"
              defaultValue={values.email}
              onChange={handleChange}
            />
            <div className={styles.buttons}>
              <ButtonDanger
                css
                marginRight="8px"
                onClick={() => {
                  auth.logout().then(() => {
                    window.location.reload();
                  });
                }}
              >
                Logout
              </ButtonDanger>
              <ButtonPrimary css disabled={!(dirty || !touched)} name="submit">
                Submit
              </ButtonPrimary>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default Profile;
