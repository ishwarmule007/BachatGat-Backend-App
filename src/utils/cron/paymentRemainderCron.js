const cron =
    require("node-cron");

const Group =
    require("../../models/Group");

const Contribution =
    require("../../models/Contribution");

const PaymentRequest =
    require("../../models/PaymentRequest");

const createNotification =
    require("../../utils/createNotification");

const runPaymentReminderCron =
    () => {

        cron.schedule(

            "0 9 * * *",

            async() => {

                try {

                    console.log(
                        "Running payment reminder cron..."
                    );

                    const today =
                        new Date();

                    const currentYear =
                        today.getFullYear();

                    const currentMonth =
                        today.getMonth();

                    const lastDateOfMonth =
                        new Date(

                            currentYear,

                            currentMonth + 1,

                            0
                        );

                    const diffTime =
                        lastDateOfMonth -
                        today;

                    const daysLeft =
                        Math.ceil(

                            diffTime /

                            (
                                1000 *
                                60 *
                                60 *
                                24
                            )
                        );

                    if (![10, 5, 1, 0]
                        .includes(daysLeft)
                    ) {
                        return;
                    }

                    const groups =
                        await Group.find({});

                    for (const group of groups) {

                        for (
                            const member
                            of group.members
                        ) {

                            if (
                                member.status !==
                                "approved"
                            ) {
                                continue;
                            }

                            const existingContribution =
                                await Contribution.findOne({

                                    userId: member.userId,

                                    groupId: group._id,

                                    month: `${currentYear}-${currentMonth + 1}`,

                                    status: "paid"
                                });

                            if (
                                existingContribution
                            ) {
                                continue;
                            }

                            const pendingPaymentRequest =
                                await PaymentRequest.findOne({

                                    userId: member.userId,

                                    groupId: group._id,

                                    month: `${currentYear}-${currentMonth + 1}`,

                                    status: "pending"
                                });

                            if (
                                pendingPaymentRequest
                            ) {
                                continue;
                            }

                            // 10 day reminder
                            if (daysLeft === 10) {

                                await createNotification({

                                    userId: member.userId,

                                    groupId: group._id,

                                    title: "Payment Reminder",

                                    message: "Your monthly payment is due in 10 days",

                                    type: "payment_reminder_10_days"
                                });
                            }

                            // 5 day reminder
                            if (daysLeft === 5) {

                                await createNotification({

                                    userId: member.userId,

                                    groupId: group._id,

                                    title: "Payment Reminder",

                                    message: "Your monthly payment is due in 5 days",

                                    type: "payment_reminder_5_days"
                                });
                            }

                            // 1 day reminder
                            if (daysLeft === 1) {

                                await createNotification({

                                    userId: member.userId,

                                    groupId: group._id,

                                    title: "Payment Reminder",

                                    message: "Your monthly payment is due tomorrow",

                                    type: "payment_reminder_1_day"
                                });
                            }

                            // overdue
                            if (daysLeft === 0) {

                                // Member notification
                                await createNotification({

                                    userId: member.userId,

                                    groupId: group._id,

                                    title: "Payment Overdue",

                                    message: "Your monthly payment is overdue",

                                    type: "payment_overdue_member"
                                });

                                // Admin notification
                                await createNotification({

                                    userId: group.adminId,

                                    groupId: group._id,

                                    title: "Member Payment Overdue",

                                    message: "A member has not completed this month's payment",

                                    type: "payment_overdue_admin"
                                });
                            }
                        }
                    }

                    console.log(
                        "Payment reminder cron completed"
                    );

                } catch (error) {

                    console.error(
                        "Payment reminder cron error:",
                        error
                    );
                }
            }
        );
    };

module.exports =
    runPaymentReminderCron;