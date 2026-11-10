---
layout: post.njk
draft: false
featured: true
title: How to Update BIOS on GIGABYTE B560M DS3H AC
headerTagline: "BIOS UPDATE "
description: A step-by-step guide to updating the BIOS on the GIGABYTE B560M
  DS3H AC (Rev. 1.x), covering Q-Flash, EFI Shell/EFIFlash, and Q-Flash Plus,
  including preparation, installation, safety precautions, and troubleshooting.
date: 2026-11-10T16:12:00.000+05:30
updated: 2026-11-10T10:44:12.435Z
author: Amitendu Bikash Dhusiya
image: /images/how-to-update-bios-on-gigabyte-b560m.jpg
imageAlt: GIGABYTE B560M DS3H AC (Rev. 1.x)
---
# How to Update BIOS on GIGABYTE B560M DS3H AC (Rev. 1.x)

Updating the BIOS (Basic Input/Output System) is an important maintenance task for a motherboard. A BIOS update can introduce security fixes, improve system stability, address hardware compatibility issues, and provide firmware improvements.

This guide explains how to update the BIOS on the **GIGABYTE B560M DS3H AC (Rev. 1.x), featuring the Intel B560 chipset**. It covers three available methods: GIGABYTE Q-Flash, EFI Shell/EFIFlash, and Q-Flash Plus.

The instructions are intended for users who want to perform the update themselves while understanding each step of the process.

## 1. Motherboard Information

Before downloading or installing any BIOS update, identify your motherboard correctly.

**Important:** GIGABYTE releases different BIOS files for different motherboard models and revisions. Always verify the motherboard model and PCB revision before downloading firmware.

Official support page:

[GIGABYTE B560M DS3H AC (Rev. 1.x) – Support & Downloads](https://www.gigabyte.com/Motherboard/B560M-DS3H-AC-rev-1x/support)

## 2. Available BIOS Update Methods

This motherboard supports multiple BIOS update methods.

### Method 1: Q-Flash

Q-Flash is GIGABYTE's built-in BIOS update utility.

It allows users to update or back up their BIOS directly from the UEFI interface without entering Windows.

This is the recommended method for a normal BIOS update when the computer can boot and access BIOS Setup.

### Method 2: EFI Shell / EFIFlash

EFI Shell is a command-line environment provided by UEFI firmware.

With this method, users boot into an EFI Shell environment and execute a vendor-provided script named `Flash.nsh`.

This guide follows the separate EFIFlash SOP supplied for the motherboard. The procedure includes checking the USB filesystem, executing the script, and allowing the system to restart before the BIOS update begins.

**Note:** Use this procedure only with the appropriate BIOS package and vendor-provided flashing instructions. Do not substitute scripts from another motherboard.

### Method 3: Q-Flash Plus

Q-Flash Plus allows users to update the BIOS without entering BIOS Setup.

It uses a dedicated USB port and a physical Q-Flash Plus button on the motherboard.

This method can also update the BIOS without installing the CPU, RAM, or graphics card, according to GIGABYTE's product documentation.

## 3. Before Starting the BIOS Update

Before performing any firmware update, complete the following preparations.

### 3.1 Check the Current BIOS Version

First, identify the BIOS version currently installed on the motherboard.

In Windows:

1. Press `Win + R`.
2. Enter `msinfo32`.
3. Press Enter.
4. Locate the **BIOS Version/Date** field.

You should see information similar to:

The version displayed on your system may be different.

Record the installed BIOS version before proceeding.

You can also check the version by entering BIOS Setup:

1. Restart the computer.
2. Press `Delete` repeatedly during startup.
3. Open the System Info section.
4. Locate the BIOS Version field.

### 3.2 Verify the Motherboard Revision

Check the motherboard PCB for the revision marking.

It should display something similar to:

The exact revision must match the firmware support page.

### 3.3 Prepare the Required Equipment

You will need:

* A GIGABYTE B560M DS3H AC (Rev. 1.x) motherboard.
* A USB flash drive.
* The correct BIOS package downloaded from GIGABYTE.
* A working computer to prepare the USB drive.
* A stable power supply.
* A keyboard and monitor for the normal Q-Flash method.

A UPS is recommended to reduce the risk of power interruption during the update.

### 3.4 BitLocker and Windows Device Encryption

If Windows Device Encryption or BitLocker is enabled, save the recovery key before updating the BIOS.

Firmware changes can affect TPM and Secure Boot measurements, potentially causing Windows to request the recovery key during startup.

Before updating:

1. Save your BitLocker recovery key somewhere accessible outside the computer.
2. Suspend BitLocker protection if applicable.
3. Complete the BIOS update.
4. Restore your previous security settings.
5. Resume BitLocker protection.
6. Verify that Windows starts normally.

Do not proceed without access to the recovery key if your Windows installation is encrypted.

## 4. Downloading the Correct BIOS

### Step 1: Open the Official GIGABYTE Website

Visit:

<https://www.gigabyte.com/>

Navigate to the motherboard support page:

[B560M DS3H AC (Rev. 1.x) – BIOS Downloads](https://www.gigabyte.com/Motherboard/B560M-DS3H-AC-rev-1x/support#support-dl-bios)

### Step 2: Select the BIOS Version

Open the BIOS download section.

Review the available BIOS versions and their release notes.

Before downloading, check:

* BIOS version.
* Release date.
* BIOS update description.
* Any installation prerequisites.
* Any restrictions on BIOS downgrading.

Always verify the latest compatible release and its instructions directly on the official support page.

Do not select firmware for a similarly named motherboard.

### Step 3: Download the BIOS Package

1. Click the Download button beside the required BIOS version.
2. Save the ZIP file.
3. Right-click the downloaded file.
4. Select Extract All.
5. Open the extracted folder.

The extracted package contains the BIOS image and may contain additional flashing utilities or scripts.

Do not rename, delete, or modify the supplied files unless the instructions for the selected flashing method specifically require it.

## 5. Method 1: Updating BIOS Using Q-Flash

Q-Flash is the recommended method for performing a normal BIOS update on a working system.

### Step 1: Prepare the USB Flash Drive

1. Connect a USB flash drive to your computer.
2. Open File Explorer.
3. Right-click the USB drive.
4. Select Format.
5. Choose `FAT32` as the filesystem.
6. Keep Quick Format enabled.
7. Click Start.

**Warning:** Formatting erases the USB drive. Back up its contents first.

### Step 2: Copy the BIOS File

Open the extracted BIOS package.

Copy the BIOS image directly into the root directory of the USB drive.

Example:

The filename will depend on the downloaded BIOS package.

Do not rename the BIOS image for normal Q-Flash.

### Step 3: Enter BIOS Setup

1. Connect the prepared USB drive to the computer.
2. Restart the computer.
3. Press `Delete` repeatedly during startup.
4. Wait for the GIGABYTE BIOS interface to appear.

### Step 4: Open Q-Flash

Once inside BIOS Setup, press:

This opens the Q-Flash utility.

You can also use the Q-Flash option available in the BIOS interface.

### Step 5: Select Update BIOS

Inside Q-Flash:

1. Select the BIOS update option.
2. Choose the USB flash drive.
3. Locate the extracted BIOS image.
4. Select the required BIOS file.

Make sure you select the correct image for the B560M DS3H AC (Rev. 1.x).

### Step 6: Confirm the Update

Q-Flash will display the selected BIOS image and may perform compatibility checks.

Review the displayed information carefully.

Confirm the update only when the BIOS file is correct and no compatibility warnings are present.

### Step 7: Wait for the Flashing Process

The BIOS flashing process will begin.

During this stage:

* Do not turn off the computer.
* Do not press the Reset button.
* Do not disconnect the power supply.
* Do not remove the USB flash drive.
* Do not interrupt the flashing process.

Wait until the update finishes.

### Step 8: Restart the Computer

After the update completes, follow the on-screen instructions.

The system may restart automatically.

Allow the motherboard to complete its startup sequence.

### Step 9: Load Optimized Defaults

After the update, enter BIOS Setup again.

Locate:

On this motherboard, the `F7` key provides access to the optimized BIOS defaults in Advanced Mode.

Before loading defaults, make sure you have recorded your previous BIOS configuration.

Loading defaults can change settings such as boot mode, SATA configuration, XMP, fan profiles, and virtualization.

Restore the required settings carefully.

Select Save & Exit after configuring the necessary options.

### Step 10: Verify the BIOS Version

After Windows starts:

1. Press `Win + R`.
2. Enter `msinfo32`.
3. Press Enter.
4. Check BIOS Version/Date.

Confirm that the displayed BIOS version matches the version you installed.

The Q-Flash update procedure is now complete.

## 6. Method 2: Updating BIOS Using EFI Shell / EFIFlash

This section follows the supplied GIGABYTE EFIFlash SOP.

Unlike Q-Flash, this method uses a bootable USB flash drive containing an EFI Shell environment and a vendor-provided flashing script.

### Step 1: Prepare the Bootable USB Flash Drive

Use the bootable EFI Shell USB prepared according to the vendor's instructions.

The USB drive must contain:

* A working EFI Shell bootloader.
* The extracted BIOS package.
* The `Flash.nsh` script.
* All other files required by the flashing package.

Do not use a random EFI Shell executable or flashing script from an unrelated motherboard package.

### Step 2: Copy the BIOS Package

Extract the downloaded BIOS ZIP file.

Copy the complete contents of the required BIOS package into the root directory of the bootable USB drive, preserving the supplied filenames.

Example:

The directory structure is illustrative. Use the actual structure supplied with your EFIFlash package.

Verify that `Flash.nsh` is present before continuing.

### Step 3: Boot into EFI Shell

1. Connect the prepared USB drive to the motherboard.
2. Restart the computer.
3. Press `F12` repeatedly during startup.
4. Open the boot menu.
5. Select the UEFI USB boot option.

The system should boot into the EFI Shell environment.

You should see a command prompt similar to:

If the EFI Shell does not boot, check the USB boot configuration and the Secure Boot restrictions. Do not change security settings without understanding the implications.

### Step 4: Identify the USB Filesystem

EFI Shell assigns filesystem identifiers to available storage devices.

Examples include:

The USB flash drive may be identified as `FS0`, but this is not guaranteed.

First, refresh the filesystem mappings:

Press Enter.

Inspect the available filesystem identifiers.

### Step 5: Open the USB Filesystem

Suppose the USB drive is identified as `FS0`.

Enter:

Press Enter.

The prompt should change to:

Now check the directory contents:

Look for:

and the required BIOS files.

If the files are not present, try another filesystem identifier.

For example:

Then:

Continue until you find the USB drive containing the flashing script.

### Step 6: Execute Flash.nsh

After verifying that you are inside the correct USB filesystem, enter:

Press Enter.

The command should look similar to:

The EFI Shell will execute the supplied batch script.

Do not modify the script or manually execute additional flashing utilities.

### Step 7: BIOS Status Verification

According to the supplied EFIFlash SOP, the script will check and confirm the BIOS status.

After this stage, the system will restart automatically.

Do not turn off the computer or interrupt the process.

### Step 8: Keep the USB Flash Drive Connected

**Important:** Do not remove the USB flash drive after the first restart.

According to the supplied SOP, the BIOS update process begins after the system restarts.

During this stage:

* Keep the USB connected.
* Do not switch off the power supply.
* Do not press the Reset button.
* Do not interrupt the update.

Wait until the BIOS update completes.

After successful completion, the system will restart again.

### Step 9: Verify the BIOS Update

1. Press `Delete` during startup.
2. Enter BIOS Setup.
3. Open System Info.
4. Check the BIOS version.
5. Confirm that the expected version is installed.

You can also verify the version through Windows using:

Then enter:

The EFIFlash procedure is now complete.

**Important:** The EFIFlash procedure described above is based on the separately supplied `BIOS Flash SOP`. It should only be used with the corresponding firmware package and instructions. It is not a substitute for the standard Q-Flash procedure.

## 7. Method 3: Updating BIOS Using Q-Flash Plus

Q-Flash Plus provides another BIOS update method.

Unlike normal Q-Flash, it does not require entering BIOS Setup.

The GIGABYTE B560M DS3H AC includes a dedicated Q-Flash Plus USB port and a physical Q-Flash Plus button.

### Step 1: Prepare a USB Flash Drive

For the Q-Flash Plus procedure:

1. Connect a USB flash drive to your computer.
2. Format it using FAT32 or FAT16.
3. Prefer a USB 2.0 flash drive.
4. Extract the downloaded BIOS package.

### Step 2: Rename the BIOS File

Locate the BIOS image in the extracted package.

Rename the BIOS image to:

This filename is specifically required for the Q-Flash Plus procedure.

Do not use this renamed filename for normal Q-Flash or EFIFlash unless their instructions explicitly require it.

### Step 3: Copy the BIOS File

Copy the renamed BIOS image directly into the USB root directory.

Example:

Do not place the file inside another folder.

### Step 4: Shut Down the Computer

1. Shut down Windows completely.
2. Ensure that the system is in the S5 shutdown state.
3. Connect the required motherboard power cables.
4. Switch on the power supply so the motherboard receives standby power.

The computer itself must remain switched off.

### Step 5: Connect the USB Flash Drive

Locate the dedicated USB port marked for Q-Flash Plus on the motherboard's rear I/O panel.

The B560M DS3H AC manual identifies a specific USB 2.0/1.1 port for this function.

Insert the USB flash drive into that port.

Do not use an arbitrary USB port.

### Step 6: Press the Q-Flash Plus Button

Locate the physical button marked:

Use the motherboard manual to identify its exact position on the PCB.

Press the Q-Flash Plus button.

The QFLED indicator should start flashing when the motherboard begins matching the BIOS image and performing the update.

### Step 7: Wait for Completion

During the update:

* Do not switch off the power supply.
* Do not remove the USB flash drive.
* Do not interrupt the flashing process.

The QFLED will stop flashing when the main BIOS flashing process is complete.

### Step 8: Start the Computer

After the flashing process finishes:

1. Follow the motherboard's instructions.
2. Power on the computer.
3. Enter BIOS Setup.
4. Verify the installed BIOS version.
5. Restore your required BIOS settings.

The Q-Flash Plus procedure is now complete.

## 8. Troubleshooting

The following table covers common problems encountered during BIOS updates.

Do not force a BIOS update when the motherboard reports an incompatibility error.

If the update fails, consult GIGABYTE support before attempting another flashing method.

## 9. Post-Update Verification Checklist

After successfully updating the BIOS, verify the following:

* BIOS update completed without errors.
* Computer restarted successfully.
* Correct motherboard model is displayed in BIOS.
* New BIOS version is confirmed.
* CPU is detected correctly.
* Installed RAM capacity is correct.
* Graphics card is detected.
* Boot drive and Windows Boot Manager are detected.
* SATA and NVMe configurations are correct.
* Secure Boot configuration is correct.
* XMP settings are restored if required.
* Fan configuration is restored.
* Windows starts successfully.
* BitLocker protection is resumed, if applicable.

## 10. Final Recommendations

For the GIGABYTE B560M DS3H AC (Rev. 1.x), the choice of flashing method depends on the situation.

For most ordinary BIOS updates, Q-Flash is the simplest option.

However, when a motherboard has a specific firmware issue or requires a vendor-provided EFIFlash procedure, follow the corresponding instructions instead of substituting another method.

**The most important rule:** Never interrupt a BIOS flashing process. An unexpected power loss or interruption during firmware writing can leave the motherboard unable to boot.
