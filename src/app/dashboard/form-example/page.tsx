'use client';

import Grid from "@mui/material/GridLegacy";
import { useForm, Controller, SubmitHandler } from "react-hook-form"
import { Button, Checkbox, Input, MenuItem, TextField, Typography } from "@mui/material";
import { buttonStyle, dashboardHeader, dashboardSubheader } from '@/styles/MaterialStyles/shared/sharedStyles';


interface IFormInput {
  firstName: string
  lastName: string
  iceCreamType: any
}

const FormPageExample = () => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      iceCreamType: {},
      Checkbox: false,
    },
  })

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    alert(JSON.stringify(data));
  }


  return (
    <>
      <Grid
        container
        alignItems="flex-start"
      >
        <Grid item xs={12}>
          <Typography variant="body1" sx={dashboardHeader}>
            Form Example Page
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid
              container
              spacing={1}
              alignItems="flex-start"
            >
              <Grid item xs={12}>
                <Typography variant="body1" sx={dashboardSubheader}>
                  First Name
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => <Input {...field} />}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1" sx={dashboardSubheader}>
                  Last Name
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => <Input  {...field} />}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1" sx={dashboardSubheader}>
                  Ice Cream Selector
                </Typography>
              </Grid>

              <Grid item xs={12}>

                <Controller
                  name="iceCreamType"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="icream-field"
                      select
                      sx={dashboardSubheader}
                      label="Select"
                      defaultValue="chocolate"
                      helperText="Please select your ice cream"
                    >
                      {[
                        { value: "chocolate", label: "Chocolate" },
                        { value: "strawberry", label: "Strawberry" },
                        { value: "vanilla", label: "Vanilla" }
                      ].map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Typography variant="body1" sx={dashboardSubheader}>
                            {option.label}
                          </Typography>
                        </MenuItem>
                      ))}
                    </TextField>

                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1" sx={dashboardSubheader}>
                  MUI Checkbox
                  <Controller
                    name="Checkbox"
                    control={control}
                    render={({ field }) => <Checkbox {...field} />}
                  />
                </Typography>

              </Grid>

              <Grid item xs={12}>
                <Button sx={buttonStyle} variant="contained" type="submit">
                  SAVE
                </Button>
              </Grid>

            </Grid>

          </form>

        </Grid>
      </Grid>
    </>

  )

}

export default FormPageExample;